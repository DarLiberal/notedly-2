const Note=require('./note');
const User=require('./user');

//создаем общий объект с моделями, с которыми будем работать
const models={
    Note,
    User
};

//экспортируем его
module.exports=models;