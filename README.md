## Install Dependencies

```
npm install
```

## Compile TypeScript Files

```
tsc
```

## Package Project

```
zip -r commute-route.zip . -x *.git* *.DS_Store* *.zip* 'src/*' 'node_modules/typescript/*'
```

......

## Invoke Lambda 

```
aws lambda invoke --function-name commute-route --region us-west-2 --payload '{"origin": "7.235714,-121.847417", "destination": "37.246404,-121.925552", "output": "default", "content_level": "Full", "start_time": "2020-11-06T11:27:00-08:00", "user_id": "changzhengj", "format": "jsons", "version": "v1"}' response.json

cat response.json 
```
The content will like '{"status":11008,"message":"Cannot fetch usual trace: No routine routes between given points ...... '.