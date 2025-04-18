from pymongo import MongoClient
import requests
import os
import psycopg2
from psycopg2 import sql
from typing import Optional


def get_unique_user_ids(mongo_uri, db_name):
    """
    Connects to MongoDB and returns a list of unique UserId values from the 'chats' collection.
    """
    client = MongoClient(mongo_uri)
    db = client[db_name]
    chats_collection = db['chats']
    user_ids = chats_collection.distinct('userId')
    client.close()
    return user_ids


def get_user_info_from_graph(user_id: str, auth_token: str) -> dict | None:
    """
    Fetches user information from Microsoft Graph API using a user ID and an auth token.

    Args:
        user_id: The ID (usually object ID or UPN) of the user in Azure AD.
        auth_token: A valid Microsoft Graph API access token.

    Returns:
        A dictionary containing the user's information (including 'displayName' for full name
        and 'onPremisesExtensionAttributes') if successful, otherwise None.
    """
    # Select specific fields to retrieve, including the extension attributes
    fields_to_select = "id,displayName,mail,userPrincipalName,onPremisesExtensionAttributes"
    graph_url = f"https://graph.microsoft.com/v1.0/users/{user_id}?$select={fields_to_select}"
    headers = {
        'Authorization': f'Bearer {auth_token}',
        'Accept': 'application/json'
    }

    try:
        response = requests.get(graph_url, headers=headers)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        user_data = response.json()
        # Returning the selected user data.
        return user_data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching user data from Graph API for {user_id}: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


class User:
    """Represents a user with information potentially from Microsoft Graph."""

    def __init__(self,
                 ms_user_id: str,
                 display_name: str,
                 mail: str,
                 user_principal_name: str,
                 kerberos: Optional[str] = None,
                 iam: Optional[str] = None,
                 titles: Optional[str] = None,
                 affiliations: Optional[str] = None,
                 departments: Optional[str] = None):
        self.ms_user_id = ms_user_id
        self.name = display_name  # Using 'name' to match DB column
        self.email = mail  # Using 'email' to match DB column
        self.upn = user_principal_name  # Using 'upn' to match DB column
        self.kerberos = kerberos
        self.iam = iam
        self.titles = titles
        self.affiliations = affiliations
        self.departments = departments


def add_user_to_pgsql(user: User, conn) -> None:
    """
    Adds a user to the PostgreSQL users table if their UPN doesn't already exist.

    Args:
        user: A User object containing the user's information.
        conn: A psycopg2 connection object to the PostgreSQL database.
    """
    # Basic validation on the User object
    if not all([user.ms_user_id, user.name, user.email, user.upn]):
        print(
            f"Error: Missing required user information in User object: {user.__dict__}")
        return

    cursor = None
    try:
        cursor = conn.cursor()
        # Check if UPN already exists
        cursor.execute(
            "SELECT 1 FROM public.users WHERE upn = %s", (user.upn,))
        exists = cursor.fetchone()

        if not exists:
            # Insert the new user
            insert_query = sql.SQL("""
                INSERT INTO public.users
                (name, email, kerberos, iam, ms_user_id, titles, affiliations, departments, upn)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """)
            cursor.execute(insert_query, (
                user.name, user.email, user.kerberos, user.iam, user.ms_user_id,
                user.titles, user.affiliations, user.departments, user.upn
            ))
            conn.commit()
            print(f"Successfully added user with UPN: {user.upn}")
        else:
            print(
                f"User with UPN {user.upn} already exists. Skipping insertion.")

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        if conn:
            conn.rollback()  # Roll back the transaction on error
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()


def migrate_user(user_id: str, auth_token: str, pg_conn) -> bool:
    """
    Fetches user info from Graph API, maps it, and adds it to PostgreSQL.

    Args:
        user_id: The Microsoft Graph user ID to migrate.
        auth_token: A valid Microsoft Graph API access token.
        pg_conn: An active psycopg2 connection object.

    Returns:
        True if the user was successfully processed (fetched and added/skipped), False otherwise.
    """
    print(f"\n--- Processing user ID: {user_id} ---")
    graph_api_user_info = get_user_info_from_graph(user_id, auth_token)
    user_object: Optional[User] = None

    if graph_api_user_info:
        try:
            ext_attrs = graph_api_user_info.get(
                'onPremisesExtensionAttributes', {}) or {}
            required_keys = ['id', 'displayName', 'mail', 'userPrincipalName']
            if not all(key in graph_api_user_info and graph_api_user_info[key] for key in required_keys):
                missing = [key for key in required_keys if not (
                    key in graph_api_user_info and graph_api_user_info[key])]
                print(
                    f"Error: Missing required Graph API fields for user ID {user_id}. Missing: {missing}")
                return False
            user_object = User(
                ms_user_id=graph_api_user_info['id'],
                display_name=graph_api_user_info['displayName'],
                mail=graph_api_user_info['mail'],
                user_principal_name=graph_api_user_info['userPrincipalName'],
                kerberos=ext_attrs.get('extensionAttribute13'),
                iam=ext_attrs.get('extensionAttribute7'),
                titles=ext_attrs.get('extensionAttribute6'),
                affiliations=ext_attrs.get('extensionAttribute8'),
                departments=ext_attrs.get('extensionAttribute9')
            )
            if user_object.kerberos:
                user_object.upn = f'{user_object.kerberos.lower()}@ucdavis.edu'
            else:
                print(
                    f"Warning: Kerberos ID (extensionAttribute13) not found for user {user_id}. Using original UPN: {user_object.upn}")
        except KeyError as e:
            print(
                f"Error mapping Graph API response to User object for ID {user_id}: Missing key {e}")
            return False
        except Exception as e:
            print(
                f"An unexpected error occurred during mapping for ID {user_id}: {e}")
            return False
    else:
        print(
            f"Failed to fetch user info for {user_id}. Skipping database add.")
        return False

    if user_object:
        try:
            add_user_to_pgsql(user_object, pg_conn)
            return True
        except Exception as e:
            print(f"Failed to add user {user_object.upn} to PostgreSQL.")
            return False
    else:
        print(
            f"Skipping database add for user ID {user_id} as User object was not created.")
        return False


if __name__ == "__main__":
    MONGO_URI = "mongodb://"
    MONGO_DB_NAME = "policywonk"  # Replace with your MongoDB database name
    dsn = "dbname=policywonk user=root password=example host=postgres port=5432"
    auth_token = """eyJ0...fA"""

    user_ids_to_migrate = get_unique_user_ids(MONGO_URI, MONGO_DB_NAME)
    if not user_ids_to_migrate:
        print("No user IDs found in MongoDB to migrate.")
        exit(0)
    else:
        print(f"Found {len(user_ids_to_migrate)} unique user IDs in MongoDB.")
    print("Starting migration process...")

    pg_conn = None
    successful_migrations = 0
    failed_migrations = 0

    try:
        print("Attempting to connect to PostgreSQL...")
        pg_conn = psycopg2.connect(dsn)
        pg_conn.autocommit = False
        print("PostgreSQL connection successful. Starting migration...")

        for user_id in user_ids_to_migrate:
            if not user_id:
                print("Skipping empty user ID found in MongoDB.")
                continue
            try:
                success = migrate_user(user_id, auth_token, pg_conn)
                if success:
                    successful_migrations += 1
                else:
                    failed_migrations += 1
            except Exception as e:
                print(
                    f"!!! Critical error processing user ID {user_id}: {e}. Rolling back transaction for this user.")
                failed_migrations += 1
                if pg_conn:
                    pg_conn.rollback()
        if pg_conn:
            print("\nCommitting successful changes to PostgreSQL...")
            pg_conn.commit()
            print("Commit successful.")
    except psycopg2.OperationalError as e:
        print(f"Unable to connect to the database: {e}")
        failed_migrations = len(user_ids_to_migrate)
    except Exception as e:
        print(
            f"An unexpected error occurred during the migration process: {e}")
        if pg_conn:
            print("Rolling back any pending changes...")
            pg_conn.rollback()
        failed_migrations = len(user_ids_to_migrate) - successful_migrations
    finally:
        if pg_conn:
            pg_conn.close()
            print("PostgreSQL connection closed.")

    print("\n--- Migration Summary ---")
    print(f"Total users found in MongoDB: {len(user_ids_to_migrate)}")
    print(
        f"Successfully processed (added or already exists): {successful_migrations}")
    print(f"Failed to process: {failed_migrations}")
    print("-------------------------")
