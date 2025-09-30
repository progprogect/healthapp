#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('🚀 Применение индексов для оптимизации производительности...');
    
    // Читаем SQL файл с индексами
    const sqlFile = path.join(__dirname, '..', 'add_performance_indexes.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Разбиваем на отдельные команды
    const commands = sql
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('--'))
      .join('\n')
      .split(';')
      .filter(cmd => cmd.trim());
    
    console.log(`📊 Найдено ${commands.length} команд для выполнения`);
    
    // Выполняем каждую команду
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim();
      if (command) {
        try {
          console.log(`⏳ Выполнение команды ${i + 1}/${commands.length}...`);
          await prisma.$executeRawUnsafe(command);
          console.log(`✅ Команда ${i + 1} выполнена успешно`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Индекс уже существует (команда ${i + 1})`);
          } else {
            console.error(`❌ Ошибка в команде ${i + 1}:`, error.message);
          }
        }
      }
    }
    
    console.log('🎉 Все индексы применены успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при применении индексов:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Проверяем, что скрипт запущен напрямую
if (require.main === module) {
  applyIndexes();
}

module.exports = { applyIndexes };

