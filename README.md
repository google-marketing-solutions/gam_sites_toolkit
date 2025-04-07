# Sites Toolkit for Google Ad Manager

## Overview

This Apps Script-based solution helps Google Ad Manager (GAM) publishers manage
their child sites by exporting site data to a Google Sheet. It addresses the
lack of filtering and exporting capabilities in the standard GAM UI for site
lists and policy violations.

The script authenticates to Ad Manager using the Sheet user's credentials, so
only users with existing access to the GAM network can import data.

## Setup & Configuration

1.  **Open the Sheet:** Once you have your copy, open the Google Sheet.
2.  **Authorize:** The first time you try to use the toolkit's menu, you will be
prompted to grant authorization for the script to access Google Sheets and your
Google Ad Manager data. Review and accept the permissions.
3.  **Configure Network Code:**
    *   Go to the `GAM Sites Toolkit` > `Settings` menu.
    *   Select `Network Code (...)`.
    *   Enter your primary Google Ad Manager Network Code.
4.  **(Optional) Configure API Version:**
    *   If needed, adjust the Ad Manager API version via `GAM Sites Toolkit` >
    `Settings` > `Ad Manager API Version (...)`.

## Usage

If the project has been deployed and configured correctly, a new menu item
called `GAM Sites Toolkit` will appear shortly after opening the container
Spreadsheet.

To import site data for the configured network:
1.  Select the desired import option under`GAM Sites Toolkit` > `Import Sites`
(e.g., `All Sites`, `Child Sites Only`, `By Child Network Code`, etc.).
2.  Confirm the import when prompted.
3.  The data will be loaded into a new sheet within the spreadsheet.

**Important:** Although only users with access to the Ad Manager network can
import new data, please be aware that the exported data will be visible to
anyone with access to the Google Sheet file, regardless of whether they have
access to the data in Google Ad

## Manual deployment

To deploy this Apps Script project to a Google Sheet:

1.  **Install `clasp`:** If you haven't already, install the `clasp`
command-line tool: `npm install -g @google/clasp`
1.  **Login to `clasp`:** Authenticate `clasp` with your Google Account:
`clasp login`
1.  **Create the Apps Script project:** In your terminal, navigate to the
directory containing the toolkit's code. Run the following command:
```bash
clasp create --type sheets --title "GAM Sites Toolkit" --rootDir build
```
This command creates a new Apps Script project bound to a Google Sheet.
1.  **Deploy the code:** Upload the local code files to the newly created Apps
Script project:
```bash
npm run deploy
```

## Test

To run the karma test suite:
```bash
npm run test
```

## Disclaimer

This is not an officially supported Google product. The code samples shared here
are not formally supported by Google and are provided only as a reference.
