# Prerequisites for this Extension to work
- Service/Job that exports JSON-File, for example via BCP 
- Database-Trigger on *Cobra_Data.DBO.AP_FIELDINFOS* that *asynchronously* starts the Service/Job

# Optional:
- View that contains all joined tables and simplifies the actual export SQL-Command.

