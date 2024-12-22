require('dotenv').config({ path: './notedly/api/.env' });

//подключаем библиотеку mongoose
const mongoose=require('mongoose');

const DB_HOST = process.env.DB_HOST;

if (!DB_HOST) {
    console.error('DB_HOST is undefined. Ensure .env is loaded and DB_HOST is set.');
    process.exit(1);
}

//экспортируем модуль
module.exports={

    //подключение БД к переменной DB_HOST, которую укажем в главном файле
    connect: DB_HOST=> {

        // Подключаемся к БД с правильными опциями которые не нужно указывать в новых версиях, тк они ставятся автоматом
        mongoose.connect(DB_HOST, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        })

            // Обработка ошибки
            .catch(err => {
                console.error(err); 
                console.log('MongoDB connection error. Please make sure MongoDB is running.');
                process.exit();
            });
    },

    //функция отключения от БД
    close:()=>{
        mongoose.connection.close();
    }
    
};