# Cobra-CRM-Mapping Extension:
This extension allows users to view all columns of a CRM database with their corresponding physical column names, user-level column names and column details. Additionally, columns can be preseleceted via table-view and users can generate SELECT-statements that conveniently include user-level aliases for further queries.

Although this extension is specificly designed for Cobra-CRM, it generally works for every database, if the JSON-file fits the expected schema.

# JSON-file example
This represents one column in the mapping.json

[
   {
      "ColNameUser":"Adressnummer",
      "ColNameLogical":"TEXT2",
      "TableNameUser":"Adressen",
      "TableNameLogical":"ADDRESSES",
      "ColDescr":"Type: nvarchar(255), Null: YES, Default: 'NULL'"
   }
]

# Prerequisites for this Extension to work:
- Service/Job that exports JSON-File, for example via BCP 
- Database-Trigger on *Cobra_Data.DBO.AP_FIELDINFOS* that *asynchronously* starts the Service/Job

# Optional:
- View that contains all joined tables and simplifies the actual export SQL-Command.

