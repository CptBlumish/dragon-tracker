# Dragon Tracker

Dragon Tracker is a small CSV-backed web app for keeping a dragon roster in one place and visualizing the roster by element.

## Run locally

Requires Node.js 18 or newer.

```text
npm start
```

Open [http://localhost:3000](http://localhost:3000).

The app reads and writes [`data/dragons.csv`](./data/dragons.csv). Adding, editing, importing, or deleting a record updates that file; the chart is rebuilt from the current records returned by the server.

## Google Sheets and downloaded CSV import

1. Put a header row in the sheet. The importer recognizes `Name`, `Species`, `Skin`, `Rarity`, `Element`, `Age`, `Health`, `Weight`, `Status`, `Location`, `Account`, `Last Seen`, and `Notes` (with common alternatives such as `Dragon`, `Variant`, `Tier`, `HP`, `Player`, and `Owner`).
2. Either set the sheet to **Anyone with the link can view** / publish it to the web and paste its URL, or download it from Google Sheets using **File → Download → Comma-separated values (.csv)** and choose that file in Dragon Tracker.
3. In Dragon Tracker, choose **Import sheet**, then use either the URL field or the downloaded CSV picker.

The import reads the first tab, converts it to CSV on the server, and merges the rows into the local registry. Rows match an existing record by `ID`, or by `Name + Account` when no ID is present. This means importing an updated sheet does not create duplicates.

Private Google Sheets are not imported yet because they require a Google OAuth connection. No Google credentials are stored by this app. Excel `.xlsx` files are also not accepted yet; export the sheet as `.csv` first.

## Data model

```text
id,name,species,skin,rarity,element,age,health,weight,status,location,account,lastSeen,notes
```
