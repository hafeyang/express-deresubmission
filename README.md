# express-deresubmission

expressjs middlware prevent resubmission,support muti records locking

# Getting Started

install express-deresubmission

`npm install express-deresubmission`

config [ioredis](https://www.npmjs.org/package/ioredis) client

```

const deresubmission = require('express-deresubmission');

const Redis = require("ioredis");

const redisClient = new Redis();

deresubmission.options({ redisClient });

```

use in router definition

```

app.post('/', deresubmission.middleware(), (req, res) => {
  res.status(200).send("ok");
});

// lock multi records
app.post('/batch', deresubmission.middleware({ key: req => req.query.keys }), (req, res) => {
    res.status(200).send(req.query.keys);
});

app.post('/single', deresubmission.middleware({ key: req => req.query.key }), (req, res) => {
  res.status(200).send(req.query.key);
});


```

should get 400 error when request again with same params

```
curl -d '' 'http://localhost:3000/'
200 ok

curl -d '' 'http://localhost:3000/'
400 'please do not resubmission'


curl -d '' 'http://localhost:3000/batch?keys=row1&keys=row2'
200 ['row1','row2']

# row1 is locked
curl -d '' 'http://localhost:3000/single?key=row1'
400 'please do not resubmission'


```

# Options

* {RedisClient} opt.redisClient ioredis client
* {string} opt.message resubmission message to user default as  "please do not resubmission"
* {number} opt.status http status when resubmission default as 400
* {number} opt.timeout prevent resubmission in timeout senconds default as 60
* {string} opt.prefix redis key prefix default as "resubmission#"
* {string|function} opt.key a uniq business key of a function return this key,multi records will locked if array returned


# Contributing

```
git clone https://github.com/hafeyang/express-deresubmission.git

npm i

npm run test

```

Authors

* hafeyang - Initial work - [hafeyang](https://github.com/hafeyang)

License

This project is licensed under the MIT License - see the [LICENSE.md](license) file for details

