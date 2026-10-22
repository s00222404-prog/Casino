/**
 * Скрипт-мост между движком WebAssembly (C++) и Telegram API
 */

// Проверяем, загружен ли модуль Emscripten
var Module = typeof Module !== 'undefined' ? Module : {};

Module['onRuntimeInitialized'] = function() {
    console.log("🚀 Графическое ядро C++ WebAssembly успешно инициализировано!");
    
    // Автоматически синхронизируем балансы из Telegram при старте
    if (window.syncGameWithBackend) {
        window.syncGameWithBackend();
    }
};

// Функция для безопасного вызова C++ кода из JavaScript
window.updateCppInterface = function(stars, tokens, refs, verified) {
    if (Module._SyncUserProfile) {
        // Вызываем скомпилированную функцию C++ напрямую
        Module._SyncUserProfile(stars, tokens, refs, verified ? 1 : 0);
    } else {
        console.warn("⚠️ Метод C++ _SyncUserProfile еще не доступен в памяти");
    }
};

window.sendGameResultToCpp = function(score, newBalance, isWin) {
    if (Module._HandleGameResult) {
        // Передаем результаты броска мяча в C++ для анимации поп-апа
        Module._HandleHandleGameResult ? Module._HandleGameResult(score, newBalance, isWin ? 1 : 0) : Module._HandleGameResult(score, newBalance, isWin);
    }
};

// Отслеживание ошибок загрузки тяжелой графики WebGL
window.addEventListener('webglcontextlost', function(event) {
    console.error('⚠️ Контекст WebGL потерян! Перезапуск графического конвейера...');
    event.preventDefault();
}, false);

console.log(" Модуль интеграции game.js подключен к системе.");
