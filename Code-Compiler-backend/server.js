const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 9000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(bodyParser.json());

// Handle Lambda invocation requests
app.post("/2015-03-31/functions/function/invocations", (req, res) => {
  // Extract the payload from the request
  const payload = req.body;

  // Get the absolute path to your lambda_function.py
  const lambdaPath = path.join(__dirname, "lambda_function.py");

  // Execute your Python Lambda function
  const python = spawn("python", [lambdaPath]);

  // Send the payload to the Python process
  python.stdin.write(JSON.stringify(payload));
  python.stdin.end();

  let result = "";

  python.stdout.on("data", (data) => {
    result += data.toString();
  });

  python.stderr.on("data", (data) => {
    console.error(`Python stderr: ${data}`);
  });

  python.on("close", (code) => {
    if (code !== 0) {
      console.error(`Python process exited with code ${code}`);
      return res.status(500).json({ error: "Lambda execution failed" });
    }

    try {
      const parsedResult = JSON.parse(result.trim());
      res.json(parsedResult);
    } catch (error) {
      console.error("Error parsing Lambda result:", error);
      res.status(500).json({ error: "Invalid Lambda response" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Lambda emulator running at http://localhost:${PORT}`);
});
