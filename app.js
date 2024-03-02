const express = require("express");
const SerialPort = require("serialport").SerialPort;
const Readline = require("@serialport/parser-readline").ReadlineParser;
const sqlite3 = require("sqlite3").verbose();
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
const twilioToNumber = process.env.TWILIO_TO_NUMBER;
const client = require("twilio")(accountSid, authToken);

const app = express();
const serverPort = 3000;

app.use(express.static("public"));

const portName = "/dev/cu.usbmodem1101"; // Change this to your Arduino port
const portOptions = {
    path: portName,
    baudRate: 9600,
};
const serialPort = new SerialPort(portOptions);

const parser = serialPort.pipe(new Readline({ delimiter: "\n" }));

const db = new sqlite3.Database("data.db");

db.serialize(() => {
    db.run(
        "CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, value REAL, voltage REAL)"
    );
});

parser.on("data", (data) => {
    const [value, voltage] = data.split(",").map(parseFloat);
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getSeconds()).padStart(2, "0");

    const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    db.run(
        "INSERT INTO sensor_data (timestamp, value, voltage) VALUES (?, ?, ?)",
        [timestamp, value, voltage],
        (err) => {
            if (err) {
                console.error("Error inserting data into database:", err);
            } else {
                handleGasSensorData(value);
                console.log("Data inserted into database:", {
                    timestamp,
                    value,
                    voltage,
                });
            }
        }
    );
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/data", (req, res) => {
    db.get(
        "SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1",
        (err, row) => {
            if (err) {
                console.error("Error querying database:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(row);
            }
        }
    );
});

app.get("/highestdata", (req, res) => {
    db.get(
        "Select max(value) as maxvalue, max(voltage) as maxvoltage, min(value) as minvalue, min(voltage) as minvoltage from sensor_data",
        (err, row) => {
            if (err) {
                console.error("Error querying database:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(row);
            }
        }
    );
});

app.get("/valueData", (req, res) => {
    db.all(
        "SELECT timestamp, value FROM sensor_data ORDER BY timestamp",
        (err, rows) => {
            if (err) {
                console.error("Error querying database:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(rows);
            }
        }
    );
});

app.get("/voltageData", (req, res) => {
    db.all(
        "SELECT timestamp, voltage FROM sensor_data ORDER BY timestamp",
        (err, rows) => {
            if (err) {
                console.error("Error querying database:", err);
                res.status(500).json({ error: "Internal server error" });
            } else {
                res.json(rows);
            }
        }
    );
});

app.listen(serverPort, () => {
    console.log(`Server running at http://localhost:${serverPort}`);
});

serialPort.on("error", (err) => {
    console.error("Serial port error:", err);
});

function sendSMS(message) {
    client.messages
        .create({
            body: message,
            from: twilioFromNumber, // Twilio phone number
            to: twilioToNumber, //  mobile phone number
        })
        .then((message) => console.log(`SMS sent: ${message.sid}`))
        .catch((error) => console.error("Error sending SMS:", error));
}

// Function to handle gas sensor data
function handleGasSensorData(data) {
    const thresholdValue = 300;
    if (data > thresholdValue) {
        sendSMS(`Gas sensor value (${data}) exceeds threshold!`);
    }
}
