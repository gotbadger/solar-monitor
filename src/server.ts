import * as express from "express";
import { argv } from "yargs";
import * as http from "http";
import * as parser from "primos-log-parser";

const app = express();
const port = argv.port || 3000;
const sdHost = argv.sdhost || "192.168.10.111";
const baseUrl = `http://${sdHost}/LOG/`;
console.log(`Starting solar monitor on port ${port}`);
console.log(`Wifi SD Card WEBDAV logs at ${baseUrl}`);

// Controller always writes to LOG dir
const sdComand = `http://${sdHost}/command.cgi?op=100&DIR=/LOG`;

function formatError(error: string) {
  return JSON.stringify({
    error,
    data: null
  });
}

app.get("/", (request, response) => {
  http
    .get(sdComand, resp => {
      let data = "";
      resp.on("data", chunk => {
        data += chunk;
      });
      resp.on("end", () => {
        const files = data
          .split("\r\n")
          .filter(line => line.startsWith("/LOG"));
        if (files.length) {
          const latest = files.reverse()[0];
          const fileDetails = latest.split(",");
          const fileName = fileDetails[1];
          parser
            .fromUrl(baseUrl + fileName)
            .then(data => {
              response.send({
                error: null,
                data
              });
            })
            .catch(err => {
              response.send(formatError(err.message));
            });
        } else {
          response.send(formatError("No log files found"));
        }
      });
    })
    .on("error", err => {
      response.send(formatError(err.message));
    });
});

app.listen(port);
