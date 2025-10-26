# 🚀 HNG-13: STAGE 1 (#track_backend)

## Country Currency & Exchange API 🌎

## Overview

This is a robust Node.js Express API designed to fetch, store, and manage country data, including population, capital, region, and dynamic currency exchange rates with estimated GDP calculations. It utilizes a MySQL database for persistence, integrates with external data sources, and generates visual summaries.

## Features

- **Automated Data Refresh**: Periodically fetches and updates comprehensive country and currency exchange data from external APIs.
- **Dynamic Data Calculation**: Computes estimated Gross Domestic Product (GDP) for countries based on their population and real-time exchange rates.
- **Country Data Management**: Provides endpoints for retrieving individual country details, listing all countries, and removing country records.
- **Query & Filtering**: Supports filtering countries by region and currency, and sorting by estimated GDP.
- **Visual Summary Generation**: Dynamically creates an image summarizing the total cached countries and the top 5 countries by estimated GDP.
- **API Health Monitoring**: An endpoint to check the current database status and the timestamp of the last data refresh.
- **Scalable Database**: Utilizes `mysql2/promise` for efficient and robust database interactions.

## Getting Started

### Installation

To get this project up and running locally, follow these steps:

📦 **Clone the Repository:**

```bash
git clone https://github.com/Jamal-09/hng_backend_2
cd hng_backend_2
```

🛠️ **Install Dependencies:**

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory and populate it with the following required environment variables:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=country_currency_db
EXTERNAL_COUNTRIES_API=https://restcountries.com/v2/all
EXTERNAL_RATES_API=https://api.exchangerate-api.com/v4/latest/USD
```

**Examples:**

- `PORT=3000`: The port on which the Express server will listen.
- `DB_HOST=localhost`: The hostname for your MySQL database.
- `DB_USER=root`: The username for connecting to your MySQL database.
- `DB_PASSWORD=your_mysql_password`: The password for your MySQL database user.
- `DB_NAME=country_currency_db`: The name of the database to be used.
- `EXTERNAL_COUNTRIES_API=https://restcountries.com/v2/all`: URL for fetching country data.
- `EXTERNAL_RATES_API=https://api.exchangerate-api.com/v4/latest/USD`: URL for fetching currency exchange rates (USD base).

## Usage

1.  **Database Migration**: Before running the server, ensure your database schema is set up.

    ```bash
    node config/migrate.js
    ```

    This command will create the `country_currency_db` database (if it doesn't exist) and the `countries` table.

2.  **Start the Server**:

    ```bash
    npm run server
    ```

    The server will start on the port specified in your `.env` file (e.g., `http://localhost:3000`).

3.  **Initial Data Refresh**: Once the server is running, perform an initial data refresh to populate the database.

    ```bash
    curl -X POST http://localhost:3000/countries/refresh
    ```

    This will fetch data from external APIs, process it, and store it in your database. It may take some time depending on the external API response times.

4.  **Accessing Endpoints**: You can now interact with the API endpoints as detailed below.

## API Documentation

### Base URL

The base URL for all country-related API endpoints is `http://localhost:3000`.

### Endpoints

#### GET /

**Overview**: Checks the API status and provides a welcome message.

**Request**:
No request body.

**Response**:

```json
{
  "message": "Country Currency & Exchange API"
}
```

**Errors**:

- `500 Internal Server Error`: Generic server error.

#### POST /countries/refresh

**Overview**: Refreshes all country and currency data by fetching from external sources, calculating estimated GDP, and updating/inserting records into the database. Also generates a summary image.

**Request**:
No request body.

**Response**:

```json
{
  "message": "Refresh successful",
  "total_countries": 250,
  "last_refreshed_at": "2023-10-27T10:30:00.000Z"
}
```

**Errors**:

- `503 Service Unavailable`: External data source unavailable (e.g., countries API or rates API down).
  ```json
  {
    "error": "External data source unavailable",
    "details": "Could not fetch data from Countries API"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred during the refresh process.

#### GET /countries

**Overview**: Retrieves a list of all cached countries, with optional filtering and sorting.

**Query Parameters**:

- `region`: Filter countries by a specific region (e.g., `Africa`, `Europe`).
- `currency`: Filter countries by a specific currency code (e.g., `USD`, `EUR`).
- `sort`: Sort the results. Currently supports `gdp_desc` for descending estimated GDP.

**Request**:
No request body.

**Example Request**:
`GET /countries?region=Europe&sort=gdp_desc`

**Response**:

```json
[
  {
    "id": 1,
    "name": "France",
    "name_lower": "france",
    "capital": "Paris",
    "region": "Europe",
    "population": 65273511,
    "currency_code": "EUR",
    "exchange_rate": 0.95,
    "estimated_gdp": 2134567890123.45,
    "flag_url": "https://restcountries.com/data/fra.svg",
    "last_refreshed_at": "2023-10-27T10:30:00.000Z",
    "created_at": "2023-10-27T09:00:00.000Z",
    "updated_at": "2023-10-27T10:30:00.000Z"
  },
  {
    "id": 2,
    "name": "Germany",
    "name_lower": "germany",
    "capital": "Berlin",
    "region": "Europe",
    "population": 83783942,
    "currency_code": "EUR",
    "exchange_rate": 0.95,
    "estimated_gdp": 2876543210987.65,
    "flag_url": "https://restcountries.com/data/deu.svg",
    "last_refreshed_at": "2023-10-27T10:30:00.000Z",
    "created_at": "2023-10-27T09:00:00.000Z",
    "updated_at": "2023-10-27T10:30:00.000Z"
  }
]
```

**Errors**:

- `500 Internal Server Error`: Generic server error.

#### GET /countries/status

**Overview**: Provides a summary of the cached data, including the total number of countries and the last refresh timestamp.

**Request**:
No request body.

**Response**:

```json
{
  "total_countries": 250,
  "last_refreshed_at": "2023-10-27T10:30:00.000Z"
}
```

**Errors**:

- `500 Internal Server Error`: Generic server error.

#### GET /countries/image

**Overview**: Retrieves the dynamically generated summary image (PNG format). This image is generated during the `/countries/refresh` operation.

**Request**:
No request body.

**Response**:
A PNG image file.

**Errors**:

- `404 Not Found`: Summary image has not been generated yet or is not found.
  ```json
  {
    "error": "Summary image not found"
  }
  ```
- `500 Internal Server Error`: Generic server error.

#### GET /countries/:name

**Overview**: Retrieves detailed information for a specific country by its name. The name lookup is case-insensitive.

**Path Parameters**:

- `name`: The full name of the country (e.g., `France`, `United States`).

**Request**:
No request body.

**Example Request**:
`GET /countries/France`

**Response**:

```json
{
  "id": 1,
  "name": "France",
  "name_lower": "france",
  "capital": "Paris",
  "region": "Europe",
  "population": 65273511,
  "currency_code": "EUR",
  "exchange_rate": 0.95,
  "estimated_gdp": 2134567890123.45,
  "flag_url": "https://restcountries.com/data/fra.svg",
  "last_refreshed_at": "2023-10-27T10:30:00.000Z",
  "created_at": "2023-10-27T09:00:00.000Z",
  "updated_at": "2023-10-27T10:30:00.000Z"
}
```

**Errors**:

- `404 Not Found`: Country not found.
  ```json
  {
    "error": "Country not found"
  }
  ```
- `500 Internal Server Error`: Generic server error.

#### DELETE /countries/:name

**Overview**: Deletes a country record from the database by its name. The name lookup is case-insensitive.

**Path Parameters**:

- `name`: The full name of the country to delete (e.g., `Canada`).

**Request**:
No request body.

**Example Request**:
`DELETE /countries/Canada`

**Response**:
`204 No Content` (Successful deletion with no response body).

**Errors**:

- `404 Not Found`: Country not found.
  ```json
  {
    "error": "Country not found"
  }
  ```
- `500 Internal Server Error`: Generic server error.

## Technologies Used

| Technology           | Description                                                                                |
| :------------------- | :----------------------------------------------------------------------------------------- |
| **Node.js**          | JavaScript runtime for building scalable server-side applications                          |
| **Express.js**       | Fast, unopinionated, minimalist web framework for Node.js                                  |
| **MySQL**            | Open-source relational database management system                                          |
| **`mysql2/promise`** | Asynchronous MySQL client for Node.js with Promise support                                 |
| **Axios**            | Promise-based HTTP client for the browser and Node.js                                      |
| **Canvas**           | Node.js Canvas implementation for generating dynamic images                                |
| **`dotenv`**         | Loads environment variables from a `.env` file                                             |
| **`nodemon`**        | Utility that automatically restarts the Node.js application                                |
| **`body-parser`**    | Node.js body parsing middleware                                                            |
| **`cors`**           | Provides a Connect/Express middleware that can be used to enable CORS with various options |
| **Jimp**             | An image processing library for Node.js, used for image manipulation                       |

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](https://opensource.org/licenses/ISC)

## 📬 Contact

Connect with me:

- 📧 Email: napg.adekunle@gmail.com
- 🌈 Slack: Jamal-09

### Built with 💻 & ❤️ by Jamal
