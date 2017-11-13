
const { test } = require('ava');
const request = require('supertest');
const express = require('express');
const mw = require("../index");
const Redis = require("ioredis");

const redisClient = new Redis();

mw.options({ redisClient });


test('prevent resubmission', async (t) => {
  await redisClient.del("resubmission#simplekey");
  const app = express();
  app.post('/', mw.middleware({ key: "simplekey" }), (req, res) => {
    res.status(200).send("ok");
  });

  const res = await request(app).post('/');
  t.is(res.statusCode, 200);
  t.is(res.text, "ok");

  const resAgain = await request(app).post('/');
  t.is(resAgain.statusCode, 400);
  t.is(resAgain.text, 'please do not resubmission');
});

test('prevent resubmission for batch records', async (t) => {
  await redisClient.del("resubmission#row1");
  await redisClient.del("resubmission#row2");
  const app = express();
  app.post('/batch', mw.middleware({ key: req => req.query.keys }), (req, res) => {
    res.status(200).send(req.query.keys);
  });

  app.post('/single', mw.middleware({ key: req => req.query.key }), (req, res) => {
    res.status(200).send(req.query.key);
  });

  const res = await request(app).post('/batch').query("keys=row1&keys=row2");
  t.is(res.statusCode, 200);
  t.deepEqual(res.body, ['row1', 'row2']);


  const resAgain = await request(app).post('/single').query('key=row1');
  t.is(resAgain.statusCode, 400);
  t.is(resAgain.text, 'please do not resubmission');
});

test('should error when middleware key not specified', async (t) => {
  const app = express();
  app.post('/', mw.middleware(), (req, res) => {
    res.status(200).send("ok");
  });
  const res = await request(app).post('/');
  t.is(res.statusCode, 500);
  t.is(res.text.indexOf('opt.key should not be empty') > -1, true);
});