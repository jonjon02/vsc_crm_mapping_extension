# Cobra-CRM-Mapping Extension:
This extension allows users to view all columns of a (CRM) database with their corresponding physical column names, user-level column names and column details. Additionally, columns can be preseleceted via table-view and users can generate SELECT-statements that conveniently include user-level aliases for further queries.

Although this extension is specificly designed for Cobra-CRM, it generally works for any database, if the json file fits the expected schema.

Download: https://marketplace.visualstudio.com/items?itemName=JohannesBruch.cobra-crm-mapping

# Json example:
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

# Starting the extension:
All commands of the Cobra-CRM-Mapping extension start with the Keyword "Cobra". When executed the first time, you will be prompted to provide a path to the mapping.json.

If the path ever changes or should be deleted from global state, use the "Cobra Load Mapping File"-Command. 

# Refreshing the data:
The extension does *not* constantly refresh the mapping-data. In order to view any changes, the extension must be restarted.

# Prerequisites for creating a mapping.json:
- View that contains data in the required format.
- Service/Job that exports JSON-File from SQL-Server, for example via BCP 
- Database-Trigger on *Cobra_Data.DBO.AP_FIELDINFOS* that *asynchronously* starts the Service/Job


