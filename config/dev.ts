export = {
    "Common": {
        "environment": "dev"
    },
    "IamGroup": [{
        "name": "AdministratorGroup",
        "managedPolicies": [
            "AdministratorAccess"
        ]
    }],
    "IamUser": [{
        "name": "soshi.miyamoto",
        "groups": ["AdministratorGroup"]
    }]
}