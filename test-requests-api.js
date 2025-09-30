// Тест API заявок
const testRequestsAPI = async () => {
  try {
    console.log('Тестируем API /api/requests/mine...');
    
    const response = await fetch('http://localhost:3001/api/requests/mine', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Статус ответа:', response.status);
    console.log('Заголовки ответа:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('Ошибка:', errorData);
      return;
    }
    
    const data = await response.json();
    console.log('Успешный ответ:', data);
    
  } catch (error) {
    console.error('Ошибка при тестировании API:', error);
  }
};

// Запускаем тест
testRequestsAPI();

