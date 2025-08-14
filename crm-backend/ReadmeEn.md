# REST API for the client database

Before launching, make sure that you have installed Node.js version 12 or higher.

To start the server, go to the repository folder and run the `node index` command. To stop, press the keyboard shortcut CTRL+C.

After starting the server, the API will be available along the path `http://localhost:3000 `.

## API Methods

All API methods that require a request body expect to receive the body as JSON. The responses of all methods are also returned as JSON.

* `GET /api/clients` get a list of clients. Parameters passed in the URL:
    * `search={search string}` the search query, when transmitted, the method returns clients whose first name, last name, patronymic, or the value of one of the contacts contains the specified substring.
* `POST /api/clients` create a new client. The client object must be passed in the request body. The response body of a successfully processed request will contain an object with the created client.
* `GET /api/clients/{id}` get the client's data by his ID. The response body of a successfully processed request will contain the client object.
* `PATCH /api/client/{id}` overwrite the data about the client with the transmitted ID. The response body of a successfully processed request will contain an object with the updated client.
* `DELETE /api/client/{id}` delete the client with the transmitted ID.

## The structure of the client's facility

```javascript
{
  // Client ID, filled in by the server automatically, cannot be changed after creation
  id: '1234567890',
  // The date and time of the client's creation is filled in by the server automatically, and cannot be changed after creation.
  createdAt: '2021-02-03T13:07:29.554Z',
  // the date and time of the client change, is filled in by the server automatically when the client changes
  updatedAt: '2021-02-03T13:07:29.554Z',
  // * required field, client's name
  name: 'Vasily',
  // * required field, last name of the client
  surname: 'Pupkin',
  // optional field, patronymic of the client
  lastName: 'Vasilyevich',
  // contacts is an optional field, an array of contacts
  // each object in the array (if passed) must contain non-empty type and value properties.
  contacts: [
    {
      type: 'Phonenumber',
      value: '+71234567890'
    },
    {
      type: 'Email',
      value: 'abc@xyz.com'
    },
    {
      type: 'Facebook',
      value: 'https://facebook.com/vasiliy-pupkin-the-best'
    }
  ]
}
```

## Possible response statuses

The server response may contain one of the response statuses:
* `200` - the request was processed normally
* `201` - The request to create a new item has been successfully processed, and the Location response header contains a link to the GET method for retrieving the created item.
* `404` - the method passed in the request does not exist or the requested item is not found in the database.
* `422` - the object passed in the request body was not validated. The response body contains an array with descriptions of validation errors.:
  ```javascript
  [
    {
      field: 'The name of the field of the object where the error occurred',
      message: 'An error message that can be shown to the user'
    }
  ]
  ```
* `500` - Curiously enough, the server broke down :(
