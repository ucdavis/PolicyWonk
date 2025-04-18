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
    user_ids = chats_collection.distinct('UserId')
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


if __name__ == "__main__":
    # Example usage: Get auth token from environment variable
    auth_token = """"""

    # user_id_to_fetch = "0a506fd0-7367-46d7-82fb-aa4c85b7c34b"
    user_id_to_fetch = "20443e5e-6d32-45dd-93bc-0b1ac1284485"  # adam
    graph_api_user_info = get_user_info_from_graph(
        user_id_to_fetch, auth_token)

    user_object: Optional[User] = None

    if graph_api_user_info:
        print(
            f"Successfully fetched user info for {user_id_to_fetch}:\n{graph_api_user_info}")
        try:
            ext_attrs = graph_api_user_info.get(
                'onPremisesExtensionAttributes', {}) or {}
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

            user_object.upn = f'{(user_object.kerberos or 'unknown').lower()}@ucdavis.edu'
            print(
                f"Mapped Graph API info to User object for UPN: {user_object.upn}\n{user_object.__dict__}")
        except KeyError as e:
            print(
                f"Error mapping Graph API response to User object: Missing key {e}")
            user_object = None
        except Exception as e:
            print(f"An unexpected error occurred during mapping: {e}")
            user_object = None
    else:
        print(f"Failed to fetch user info for {user_id_to_fetch}.")

    dsn = "dbname=policywonk user=root password=example host=postgres port=5432"

    pg_conn = None
    try:
        print("Attempting to connect to PostgreSQL...")
        pg_conn = psycopg2.connect(dsn)
        print("Connection successful.")

        if user_object and pg_conn:
            print(f"Attempting to add user {user_object.upn} to PostgreSQL...")
            add_user_to_pgsql(user_object, pg_conn)
        elif not user_object:
            print("Skipping PostgreSQL add: User object not created or mapping failed.")
        elif not pg_conn:
            print("Skipping PostgreSQL add: Database connection not established.")

    except psycopg2.OperationalError as e:
        print(f"Unable to connect to the database: {e}")
    except Exception as e:
        print(f"An error occurred during PostgreSQL operation: {e}")
    finally:
        if pg_conn:
            pg_conn.close()
            print("PostgreSQL connection closed.")
