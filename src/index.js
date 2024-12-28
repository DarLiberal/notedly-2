console.log("Working directory:", process.cwd());
console.log("Directory contents:", require('fs').readdirSync('.'));


//модуль для ограничения грубины/вложенности запроса
const depthLimit=require('graphql-depth-limit');

//модуль для ограничения общей сложности запроса
const {createComplexityLimitRule}=require('graphql-validation-complexity');

//импорт корс пакета для использования ресурсов с других доменов
const cors=require('cors');

//импорт хелмет пакета для использования беззопасности в частности HTTP-заголовка
const helmet=require('helmet');

//добавляем express и Apollo Server GraphQL
const express=require("express");
const {ApolloServer}=require('apollo-server-express');

const jwt = require('jsonwebtoken');

//импорт конфигурации .env (dotenv)
require('dotenv').config();

//импорт файла db.js
const db=require('./db');

//импорт моделей из models
const models=require('./models')

//схема GrapgQL
const typeDefs = require('./schema');

//распознаватель схемы GrapgQL
const resolvers = require('./resolvers');
const { Token } = require("graphql");

//запускаем сервер на порте из файла .env, или на порте 4000 
const port=process.env.PORT || 10000;

//импорт переменной DB_HOST из файла .env
const DB_HOST=process.env.DB_HOST;

//создаем express-приложение app
const app=express();

//добавляем промежуточное ПО хелмет для его использования
app.use(helmet());

//добавляем промежуточное ПО корс для его использования
app.use(cors());

//подключаем БД по адресу DB_HOST в файл db.js
db.connect(DB_HOST);

//настроим Apollo Server со схемой и распознавателем gql, создадим его
const server=new ApolloServer(
    {
        typeDefs,
        resolvers,
        //добавляем правила ограничения нагруженности запросов - validationRules
        //depthLimit(5) значит что глубина/вложенность запроса может быть не более 5
        //createComplexityLimitRule(1000) значит что нагруженность запроса в виде полей и их вложенности ограничена 1000
        validationRules:[depthLimit(5),createComplexityLimitRule(1000)],
        context: ({req})=>{
            //создаем переменную с токеном который выдергиваем из HTTP-запроса (authorization)
            const token=req.headers.authorization;
            //создаем объект юзера с информацией о нем с помощью токена
            const user=getUser(token);
            //выводим данные пользователя
            console.log(user);
            //добавляем модели БД и пользователя данные в context
            return {models,user};
        }
    }
);

//после обновления в apolloServer стало нужно вписывать ожидание старта сервера
server.start().then(res => {

    //применение промежуточного ПО Apollo GraphQL и пишем путь к нему через /api , короче запуск сервера apollo
    server.applyMiddleware({app, path:'/api'});

    app.listen({port},()=>
        console.log(
            `GraphQL Server running at http://localhost:${port}${server.graphqlPath}`
        )
    );
});

//получаем информацию пользователя из jwt и проверяем действительность токена
const getUser = token =>{
    //если токен есть, то работаем дальше
    if(token){
        try{
            //возвращаем информацию пользователя из его токена, т е сначала сравниваем токены : введенный и тот что хранится в jwt
            return jwt.verify(token,process.env.JWT_SECRET);
        } catch(err) {
            //если ошибка с токеном
            new Error('Session invalid');
        }
    }
};