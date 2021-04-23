# mongo-backup-boilerplate

![GitHub](https://img.shields.io/github/license/jtaylorchang/mongo-backup-boilerplate) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/jtaylorchang/mongo-backup-boilerplate.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/jtaylorchang/mongo-backup-boilerplate/context:javascript)

This is a boilerplate designed to be ready to use. Simply create a new repo using this as the template and update the secrets file. It is designed to backup the data to itself by running the backup command.

## Setup

1. Install dependencies

Run `yarn` to install the dependencies

2. Update secrets

Create `secrets.json` containing MongoDB connection string with password and the name of the database you want to backup.

```javascript
{
    "MONGODB_URI": "mongodb+srv://server:<PASSWORD>@<DB>.mongodb.net/test?retryWrites=true&w=majority",
    "DB_NAME": "<DB_NAME>"
}
```

## How to run

Run `yarn backup` (or `npm` equivalent). This will create a timestamped folder, connect to the Mongo instance, get a list of all the collections, download each as a named JSON file into the new folder, and then commit and push the backup to this repo.
