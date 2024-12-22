//импортируем схему запроса
const Query = require('./query');

//импортируем схему мутации
const Mutation = require('./mutation');

const Note = require('./note');

const User = require('./user');

const {GraphQlDateTime}=require("graphql-iso-date");

//экспортируем модули 
module.exports = {
    Query,
    Mutation,
    Note,
    User,
    DateTime: {GraphQlDateTime}
};