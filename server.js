import express from "express";
import {google} from "googleapis";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = 3000;

const clientID = `${process.env.GOOGLE_CLIENT_ID}`;
const clientSecret = `${process.env.GOOGLE_CLIENT_SECRET}`;

// Set up the client with the appropriate credentials
const client = new google.auth.JWT(clientID, null, clientSecret, [
	"https://www.googleapis.com/auth/spreadsheets",
]);

// The ID of your Google Sheets document (found in the URL)
const spreadsheetId = `${process.env.GOOGLE_SHEET_ID}`;

// Function to create a new row in the Google Sheet
async function createRow(data) {
	try {
		await client.authorize();
		const sheets = google.sheets({version: "v4", auth: client});
		const response = await sheets.spreadsheets.values.append({
			spreadsheetId,
			range: "Sheet1", // Replace with the name of the sheet you want to append data to
			valueInputOption: "RAW",
			insertDataOption: "INSERT_ROWS",
			resource: {
				values: [Object.values(data)],
			},
		});
		return response.data;
	} catch (error) {
		console.error("Error creating row:", error.message);
		throw error;
	}
}

// Function to get all rows from the Google Sheet
async function getAllRows() {
	try {
		await client.authorize();
		const sheets = google.sheets({version: "v4", auth: client});
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: "Sheet1", // Replace with the name of the sheet you want to read data from
		});
		return response.data.values;
	} catch (error) {
		console.error("Error getting rows:", error.message);
		throw error;
	}
}

// Function to delete data rows (excluding title row) from the Google Sheet
async function deleteDataRows() {
	try {
		await client.authorize();
		const sheets = google.sheets({version: "v4", auth: client});
		const response = await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: "Sheet1!A2:Z", // Replace with the appropriate range to clear data rows
		});
		return response.data;
	} catch (error) {
		console.error("Error deleting data rows:", error.message);
		throw error;
	}
}

// Create a new row using the data sent in the request body
app.post("/api/create", async (req, res) => {
	try {
		const data = req.body;
		await createRow(data);
		res.status(201).json({message: "Row created successfully"});
	} catch (error) {
		res.status(500).json({error: "Error creating row"});
	}
});

// Get all rows from the Google Sheet
app.get("/api/get", async (req, res) => {
	try {
		const rows = await getAllRows();
		res.json(rows);
	} catch (error) {
		res.status(500).json({error: "Error getting rows"});
	}
});

// Delete all rows from the Google Sheet
app.delete("/api/deleteAll", async (req, res) => {
	try {
		await deleteDataRows();
		res.json({message: "All rows deleted successfully"});
	} catch (error) {
		res.status(500).json({error: "Error deleting all rows"});
	}
});

//middlewares
app.use(cors());
// app.use(bodyParser.json());
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({extended: true}));

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
