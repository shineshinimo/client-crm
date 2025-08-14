# CRM Client Management Interface

## 📌 Project Description
A web interface for a CRM system to manage clients. It provides functionality for viewing, adding, editing, and deleting clients with a user-friendly interface, as well as search and sorting features.

## ⚙️ Features
- View the client list in a table format.
- Add a new client via a modal window.
- Edit an existing client's information (full name and contact details).
- Delete a client with confirmation.
- Sort data by ID, full name, creation date, and modification date.
- Search clients by full name.
- Support for up to 10 contacts per client.
- Animated modal windows and hover effects for buttons.

## 🗂 Client Data Structure
Each client contains:
- **Full Name**: Last Name, First Name, Middle Name.
- **ID**: Unique client identifier.
- **Creation Date** and **Last Modification Date**.
- **Contacts**:
  - Type (Phone, Email, Facebook, VK, Other)
  - Value (phone number, email, link, etc.)

## 🖥 Interface
- **Client Table**:  
  - ID  
  - Full Name  
  - Creation Date & Time  
  - Last Modification Date & Time  
  - Contacts with type-specific icons  
  - Action buttons: "Edit" and "Delete"

- **Contacts**:
  - VK, Facebook, phone, and email — display corresponding icons.
  - Other contact types — display a generic person icon.
  - On hover, show a tooltip in the format:  
    `Type: value`  
    *(Example: Email: abc@abc.ru)*

- **Modal Windows**:
  - Add Client.
  - Edit Client (fetch latest data from API before opening).
  - Delete Confirmation.

## 🔍 Sorting and Search
- Sorting by clicking on column headers (except contacts and actions).
- Implemented on the client side via JavaScript.
- Search clients by full name in the search bar.

## 🛠 Technologies
- HTML, CSS, JavaScript
- Node.js (backend)
- API for retrieving, adding, updating, and deleting clients
- Animations and hover effects

## 🚀 Installation and Launch
1. Clone the repository:
   ```bash
   git clone https://github.com/shineshinimo/client-crm.git
   ```

2. Navigate to the project folder:
   ```bash
   cd client-crm
   ```

3. Start the backend:
   ```bash
   node crm-backend/index.js
   ```

4. Open `index.html` in your browser to launch the frontend.
