from pymongo import MongoClient
import requests
import os


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
        # Optionally print response content for debugging
        # if response is not None:
        #     print(f"Response content: {response.text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return None


if __name__ == "__main__":
    # Example usage: Get auth token from environment variable

    user_id_to_fetch = "0a506fd0-7367-46d7-82fb-aa4c85b7c34b"
    user_info = get_user_info_from_graph(user_id_to_fetch, auth_token)

    if user_info:
        print(f"Successfully fetched user info for {user_id_to_fetch}:")
        print(user_info)
    else:
        print(f"Failed to fetch user info for {user_id_to_fetch}.")
