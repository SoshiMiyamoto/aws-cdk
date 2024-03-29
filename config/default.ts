export = {
    "Common": {
        "systemName": "cdk"
    },
    "CodePipeline" : {
        "name": "Pipeline",
        "repository": "aws-cdk",
        "owner": "SoshiMiyamoto",
        "branch": "master",
        "connectionId": "5e47ba61-ce25-449c-8443-e5fb6825219e"
    },
    "SecretsManager": [{
        "name": "iam-initial-password"
    }],
    "iam":{
        "group":{
            "group-a":[
                "test.miyamotoA",
                "test.miyamotoA1"
            ],
            "group-b":[
                "test.miyamotoB"
            ],
            "group-a/group-b":[
                "test.miyamotoAB"
            ]
        }
    }
}