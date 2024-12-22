const mongoose=require('mongoose');
//импорт bcrypt для шифрования паролей
const bcrypt=require('bcrypt');
//импорт jwt для работы с токеном
const jwt=require('jsonwebtoken');

//импорт функций обнаружения ошибок при аутентификации
const {
    AuthenticationError,
    ForbiddenError
} = require('apollo-server-express');

//импортируем конфигурации .env
require('dotenv').config

//импорт файла для граватара с функцией его созания по имейлу
const gravatar = require('../util/gravatar');
const { model } = require('mongoose');
const e = require('express');

module.exports = {

    //создание заметки в БД с закрепленным автором или с указанным в виде аргумента
    newNote: async (parent,args,{models,user}) => {
        //проверяем авторизованность с помощью user, если его нет, выдаем ошибку на создание заметки тк не авторизованы
        if(!user){
            throw new AuthenticationError('You must be signed in to create a note');
        }

        return await models.Note.create({
            content: args.content,
            //создаем заметку и добавляем в поле автора айди авторизованного юзера от кого создается заметка
            author: mongoose.Types.ObjectId(user.id)
        });
    },
    
    //удаление заметки по айди ID
    deleteNote: async(parent,{id},{models,user})=>{
        //если чел не авторизовался выдаем ошибку, что надо авторизоваться чтобы удалить заметку
        if(!user){
            throw new AuthenticationError('You must be signed in to delete a note');
        }

        //если пользователь авторизован,то мы ищем заметку по айди, какую хотим удалить
        const note=await models.Note.findById(id);

        //если заметка нашлась и пользователь у заметки и тот кто пытается ее удалить не совпадают, то пишем ошибку что недостаточно прав для удаления
        if(note&&String(note.author)!==user.id){
            throw new ForbiddenError("You don't have permissions to delete the note")
        }

        try{
            //если же все нормально, то работаем по схеме поиска и удаления
            await note.remove();
            return true;
        } catch (err) {
            //если же возникает и здесь ошибка то мы возвращаем false
            return false;
        }
    },

    //обновление заметки по айди ID
    updateNote: async(parent,{content, id},{models,user})=>{
        //если чел не авторизовался выдаем ошибку, что надо авторизоваться чтобы обновить заметку
        if(!user){
            throw new AuthenticationError('You must be signed in to update a note');
        }

        //если пользователь авторизован,то мы ищем заметку по айди, какую хотим обновить
        const note=await models.Note.findById(id);

        //если заметка нашлась и пользователь у заметки и тот кто пытается ее обновить не совпадают, то пишем ошибку что недостаточно прав для обновления
        if(note&&String(note.author)!==user.id){
            throw new ForbiddenError("You don't have permissions to update the note")
        }
         
        //если все ок то обновляем и возвращаем заметку
        return await models.Note.findOneAndUpdate(
            {
                _id: id,
            },
            {
                $set:{
                    content
                },
            },
            {
                new:true
            }
        );
    },

    //регистрация аккаунта
    signUp: async(parent,{username,email,password},{models})=>{
        
        //далее преобразуем данные которые получили:

        //нормализуем имеил
        email=email.trim().toLowerCase();
        //хэшируем пароль и солим
        const hashed=await bcrypt.hash(password,10);
        //создаем граватар
        const avatar=gravatar(email);

        try{
            //если ошибок нет, мы создаем модель юзера в бд с полями введенными и преобразованными
            const user=await models.User.create({
                username,
                email,
                avatar,
                password:hashed
            });
            //генерируем jwt токени по айди и заносим в JWT_SECRET и выводим его в graphQl
            return jwt.sign({id:user._id},process.env.JWT_SECRET);

        } catch (err) {
            console.log(err);
            //в случае ошибки расплывчатая ошибка
            throw new Error('Error creating account');
        }
    },

    //авторизация
    signIn: async (parent,{username,email,password},{models})=>{
        
        if(email){
            //если введен мэил, то его нормализуем для проверки
            email=email.trim().toLowerCase();
        }

        //а если введено имя пользователя, оно таким и остается

        //создаем переменную, хранящую данные о пользователе из бд, которого мы найдем (если найдем) по имеилу или имени 
        const user= await models.User.findOne({
            $or: [{email},{username}]
        });

        //если такая переменная не создалась, т.е пользователь не нашелся, то мы выдаем расплывчатую ошибку
        if(!user) {
            throw new AuthenticationError('Error signing in');
        }

        //далее создаем переменную, которая получит true или false от того, что мы сравним пароли: введенный и тот который был в бд в user
        const valid = await bcrypt.compare(password,user.password);
        
        //если valid=false, значит пароли не совпали при расшифровке и также выдаем расплывчатую ошибку
        if(!valid){
            throw new AuthenticationError('Error signing in');
        }

        //если же все совпало, мы генерируем jwt токен для пользователя и заносим в .env в JWT_SECRET (при каждом входе генерируется новый токен)
        return jwt.sign({id:user._id},process.env.JWT_SECRET);
    },

    //добавление в избранное
    toggleFavorite: async (parent,{id},{models,user})=>{

        //проверяем авторизован ли пользователь
        if(!user){
            throw new AuthenticationError();
        }

        //ищем заметку по айди которую хотим проверить
        let noteCheck = await models.Note.findById(id);
        //из найденной заметки проверяем поле favoritedBy и ищем индекс пользователя через его айди авторизованного аккаунта
        const hasUser = noteCheck.favoritedBy.indexOf(user.id);

        //если пользователь есть в поле заметки favoritedBy и его значение > 0 то значит эта заметка есть у пользователя в избранном
        if(hasUser>=0){
            //ищем заметку в модели note по айди из параметра
            return await models.Note.findByIdAndUpdate(
                id,
                {
                    //вытягиваем или удаляем айди этого пользователя из массива с айди тех юзеров у кого заметка в избранном
                    $pull:{
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    //вычисление количества лайков грубо говоря. Делаем -1
                    $inc: {
                        favoriteCount: -1
                    }
                },
                {
                    //возвращаем обновленную заметку
                    new: true
                }
            );
        } else {
            //ищем заметку в модели note по айди из параметра
            return await models.Note.findByIdAndUpdate (
                id,
                {
                    //втесняем или добавляем айди этого пользователя в массив с айди тех юзеров у кого заметка в избранном
                    $push: {
                        favoritedBy: mongoose.Types.ObjectId(user.id)
                    },
                    //вычисление количества лайков грубо говоря. Делаем +1
                    $inc: {
                        favoriteCount: 1
                    }
                },
                {
                    //возвращаем обновленную заметку
                    new: true
                }
            );
        }
    }
}