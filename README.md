# CDK Lambda APIGW DDB

This is a demo showing how to deploy a TypeScript Lambda with CRUD functionality behind an API Gateway (HTTP API), backed by a Dynamo DB table


## Prerequisites

- Docker
- Node 18+
- awscli


## Installation

1. Clone this repository

2. Install NPM dependencies

`npm install`


## Deploy

1. Deploy DB Stack

`cdk deploy DbStack`

2. Deploy API Stack

`cdk deploy ApiStack`
