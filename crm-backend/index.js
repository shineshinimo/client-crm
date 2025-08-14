const { existsSync, readFileSync, writeFileSync } = require('fs');
const { createServer } = require('http');

const DB_FILE = process.env.DB_FILE || './db.json';
const PORT = process.env.PORT || 3000;
const URI_PREFIX = '/api/clients';

class ApiError extends Error {
  constructor(statusCode, data) {
    super();
    this.statusCode = statusCode;
    this.data = data;
  }
}

function drainJson(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(JSON.parse(data));
    });
  });
}

function makeClientFromData(data) {
  const errors = [];

  function asString(v) {
    return v && String(v).trim() || '';
  }

  const client = {
    name: asString(data.name),
    surname: asString(data.surname),
    lastName: asString(data.lastName),
    contacts: Array.isArray(data.contacts) ? data.contacts.map(contact => ({
      type: asString(contact.type),
      value: asString(contact.value),
    })) : [],
  };

  if (!client.name) errors.push({ field: 'name', message: 'Не указано имя' });
  if (!client.surname) errors.push({ field: 'surname', message: 'Не указана фамилия' });
  if (client.contacts.some(contact => !contact.type || !contact.value))
    errors.push({ field: 'contacts', message: 'Не все добавленные контакты полностью заполнены' });

  if (errors.length) throw new ApiError(422, { errors });

  return client;
}

function getClientList(params = {}) {
  const clients = JSON.parse(readFileSync(DB_FILE) || '[]');
  if (params.search) {
    const search = params.search.trim().toLowerCase();
    return clients.filter(client => [
      client.name,
      client.surname,
      client.lastName,
      ...client.contacts.map(({ value }) => value)
    ]
      .some(str => str.toLowerCase().includes(search))
    );
  }
  return clients;
}

function createClient(data) {
  const newItem = makeClientFromData(data);
  newItem.id = Date.now().toString();
  newItem.createdAt = newItem.updatedAt = new Date().toISOString();
  writeFileSync(DB_FILE, JSON.stringify([...getClientList(), newItem]), { encoding: 'utf8' });
  return newItem;
}

function getClient(itemId) {
  const client = getClientList().find(({ id }) => id === itemId);
  if (!client) throw new ApiError(404, { message: 'Client Not Found' });
  return client;
}

function updateClient(itemId, data) {
  const clients = getClientList();
  const itemIndex = clients.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new ApiError(404, { message: 'Client Not Found' });
  Object.assign(clients[itemIndex], makeClientFromData({ ...clients[itemIndex], ...data }));
  clients[itemIndex].updatedAt = new Date().toISOString();
  writeFileSync(DB_FILE, JSON.stringify(clients), { encoding: 'utf8' });
  return clients[itemIndex];
}

function deleteClient(itemId) {
  const clients = getClientList();
  const itemIndex = clients.findIndex(({ id }) => id === itemId);
  if (itemIndex === -1) throw new ApiError(404, { message: 'Client Not Found' });
  clients.splice(itemIndex, 1);
  writeFileSync(DB_FILE, JSON.stringify(clients), { encoding: 'utf8' });
  return {};
}

if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '[]', { encoding: 'utf8' });

module.exports = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }

  if (!req.url || !req.url.startsWith(URI_PREFIX)) {
    res.statusCode = 404;
    res.end(JSON.stringify({ message: 'Not Found' }));
    return;
  }

  const [uri, query] = req.url.substr(URI_PREFIX.length).split('?');
  const queryParams = {};

  if (query) {
    for (const piece of query.split('&')) {
      const [key, value] = piece.split('=');
      queryParams[key] = value ? decodeURIComponent(value) : '';
    }
  }

  try {
    const body = await (async () => {
      if (uri === '' || uri === '/') {
        if (req.method === 'GET') return getClientList(queryParams);
        if (req.method === 'POST') {
          const createdItem = createClient(await drainJson(req));
          res.statusCode = 201;
          res.setHeader('Access-Control-Expose-Headers', 'Location');
          res.setHeader('Location', `${URI_PREFIX}/${createdItem.id}`);
          return createdItem;
        }
      } else {
        const itemId = uri.substr(1);
        if (req.method === 'GET') return getClient(itemId);
        if (req.method === 'PATCH') return updateClient(itemId, await drainJson(req));
        if (req.method === 'DELETE') return deleteClient(itemId);
      }
      return null;
    })();
    res.end(JSON.stringify(body));
  } catch (err) {
    if (err instanceof ApiError) {
      res.writeHead(err.statusCode);
      res.end(JSON.stringify(err.data));
    } else {
      res.statusCode = 500;
      res.end(JSON.stringify({ message: 'Server Error' }));
      console.error(err);
    }
  }
})
  .on('listening', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`The CRM server is running. You can use it at http://localhost:${PORT}`);
      console.log('Press CTRL+C to stop the server');
      console.log('Available methods:');
      console.log(`GET ${URI_PREFIX} - to get a list of clients, you can pass a search query to the query parameter search`);
      console.log(`POST ${URI_PREFIX} - to create a client, in the request body you need to pass the object { name: string, surname: string, lastName?: string, contacts?: object[] }`);
      console.log(`\tcontacts - an array of contact objects of the type { type: string, value: string }`);
      console.log(`GET ${URI_PREFIX}/{id} - get a client by his ID`);
      console.log(`PATCH ${URI_PREFIX}/{id} - to change the client with the ID, you need to pass the object in the request body { name?: string, surname?: string, lastName?: string, contacts?: object[] }`);
      console.log(`\tcontacts - an array of contact objects of the type { type: string, value: string }`);
      console.log(`DELETE ${URI_PREFIX}/{id} - delete a client by ID`);
    }
  })
  .listen(PORT);
