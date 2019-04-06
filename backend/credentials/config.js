/**
 * Environment variables and auth scopes.
 * 
 * Each script in need of env vars must call this one
 */

 const path = require('path')

require('dotenv').config({path: path.resolve(__dirname, '.env')}); // load .env file into process.env

// If modifying these scopes, delete user token credentials
const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses',
  'https://www.googleapis.com/auth/classroom.profile.emails',
  'https://www.googleapis.com/auth/classroom.profile.photos',
  'https://www.googleapis.com/auth/classroom.push-notifications',
  'https://www.googleapis.com/auth/classroom.rosters',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly'
];
exports.SCOPES = SCOPES
