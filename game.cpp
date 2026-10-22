#include "raylib.h"
#include <emscripten.h>
#include <cmath>
#include <string>

// Структура ультрасовременной графики Premium Glassmorphic Casino
struct PremiumTheme {
    Color bgDark = { 10, 12, 18, 255 };         // Глубокий, дорогой космический фон
    Color glassBase = { 28, 36, 50, 160 };      // Полупрозрачное матовое стекло (основа)
    Color glassGlow = { 255, 255, 255, 12 };    // Верхний глянцевый отблеск для объёма
    Color neonBlue = { 0, 198, 255, 255 };      // Яркий неоновый лед для акцентов
    Color neonGold = { 255, 170, 0, 255 };      // Жидкое золото для выигрышей
    Color borderGlass = { 255, 255, 255, 30 };  // Тончайшая стеклянная грань, ловящая свет
    Color textWhite = { 255, 255, 255, 255 };
};

const int screenWidth = 1080;
const int screenHeight = 1920;
PremiumTheme theme;
float animTimer = 0.0f;
float bearScale = 1.0f;

// Балансы игрока
double starsBalance = 250.00;
double internalTokens = 0.00;
std::string statusText = "ДОСТУП ЗАБЛОКИРОВАН 🔒";

// Функция отрисовки карточки с эффектом 3D-стекла и мягкими углами
void DrawVolumeGlassCard(Rectangle rect, float radius, Color accentColor) {
    // 1. Мягкая внешняя тень (объём под карточкой)
    DrawRectangleRounded({ rect.x, rect.y + 8, rect.width, rect.height }, radius, 8, { 0, 0, 0, 90 });
    
    // 2. Основное матовое стекло
    DrawRectangleRounded(rect, radius, 8, theme.glassBase);
    
    // 3. Глянцевый верхний полу-блик (создает эффект объемной стеклянной линзы)
    Rectangle topHighlight = { rect.x, rect.y, rect.width, rect.height / 2.0f };
    DrawRectangleRounded(topHighlight, radius, 8, theme.glassGlow);
    
    // 4. Тонкая объемная фаска (градиентный или мягкий контур стекла)
    DrawRectangleRoundedLines(rect, radius, 8, 2, theme.borderGlass);
    
    // 5. Нижнее неоновое свечение-индикатор (отражение неонового света внутри стекла)
    Rectangle bottomNeonLine = { rect.x + 40, rect.y + rect.height - 3, rect.width - 80, 3 };
    DrawRectangleRounded(bottomNeonLine, 1.0f, 4, ColorAlpha(accentColor, 0.6f));
}

// Главный цикл отрисовки игры
void UpdateDrawFrame(void) {
    animTimer += GetFrameTime();
    bearScale = 1.0f + 0.04f * std::sin(animTimer * 2.5f);

    BeginDrawing();
    ClearBackground(theme.bgDark);

    // Дорогой задний фон: Мягкие световые сферы (Ambient Light под стеклом)
    DrawCircleGradient(screenWidth / 2, 400, 600, ColorAlpha(theme.neonBlue, 0.08f), ColorAlpha(theme.bgDark, 0));
    DrawCircleGradient(screenWidth / 2, 1000, 800, ColorAlpha(theme.neonGold, 0.05f), ColorAlpha(theme.bgDark, 0));

    // ==========================================
    // ВЕРХНИЕ КАРТОЧКИ БАЛАНСА (Объемное 3D Стекло)
    // ==========================================
    
    // Левая карточка: Звёзды
    DrawVolumeGlassCard({ 60, 100, 440, 160 }, 0.35f, theme.neonBlue);
    DrawText("Баланс TG Stars", 95, 130, 24, ColorAlpha(theme.textWhite, 0.5f));
    DrawText((std::to_string((int)starsBalance) + ".00 ⭐").c_str(), 95, 175, 46, theme.textWhite);

    // Правая карточка: Внутренние токены
    DrawVolumeGlassCard({ 580, 100, 440, 160 }, 0.35f, theme.neonBlue);
    DrawText("Внутренние звёзды", 615, 130, 24, ColorAlpha(theme.textWhite, 0.5f));
    DrawText((std::to_string(internalTokens) + " 💠").c_str(), 615, 175, 46, theme.neonBlue);

    // ==========================================
    // ИГРОВЫЕ КНОПКИ-ПЛАШКИ (Мягкие круглые формы)
    // ==========================================
    
    // 🏀 Кнопка Баскетбол (Активная)
    DrawVolumeGlassCard({ 60, 320, 290, 110 }, 0.45f, theme.neonGold);
    DrawText("🏀 Мяч", 140, 355, 34, theme.textWhite);

    // 🎳 Кегли (Заблокированная/Размытая)
    DrawRectangleRounded({ 395, 320, 290, 110 }, 0.45f, 8, ColorAlpha(theme.glassBase, 0.5f));
    DrawRectangleRoundedLines({ 395, 320, 290, 110 }, 0.45f, 8, 1, ColorAlpha(theme.borderGlass, 0.2f));
    DrawText("🎳 Кегли", 470, 355, 34, ColorAlpha(theme.textWhite, 0.3f));

    // 🎲 Кубик (Заблокированная/Размытая)
    DrawRectangleRounded({ 730, 320, 290, 110 }, 0.45f, 8, ColorAlpha(theme.glassBase, 0.5f));
    DrawRectangleRoundedLines({ 730, 320, 290, 110 }, 0.45f, 8, 1, ColorAlpha(theme.borderGlass, 0.2f));
    DrawText("🎲 Кубик", 810, 355, 34, ColorAlpha(theme.textWhite, 0.3f));

    // ==========================================
    // ЦЕНТРАЛЬНАЯ ВИТРИНА НАГРАДЫ (Главный стеклянный бокс)
    // ==========================================
    
    DrawVolumeGlassCard({ 60, 500, 960, 800 }, 0.25f, theme.neonBlue);

    // Свечение под медведем
    Vector2 center = { (float)screenWidth / 2, 860 };
    DrawCircleGradient(center.x, center.y, 300 * bearScale, ColorAlpha(theme.neonBlue, 0.12f), ColorAlpha(theme.bgDark, 0));

    // Отрисовка Глянцевой Иконки Подарка
    DrawCircle(center.x, center.y, 150 * bearScale, ColorAlpha(theme.bgDark, 180));
    DrawCircleLines(center.x, center.y, 150 * bearScale, ColorAlpha(theme.neonGold, 0.7f));
    DrawText("🧸", center.x - 70, center.y - 85, 140 * bearScale, WHITE);

    // Текст внутри стеклянного бокса
    DrawText("ВЫ ВЫИГРАЛИ ПОДАРОК!", screenWidth / 2 - 260, 1120, 38, theme.neonGold);
    DrawText("Telegram Star Gift: Плюшевый Мишка", screenWidth / 2 - 320, 1190, 32, theme.textWhite);

    // ==========================================
    // ИНФОРМАЦИОННАЯ ПАНЕЛЬ И КНОПКА ДЕЙСТВИЯ
    // ==========================================
    
    // Панель статуса подписки
    DrawVolumeGlassCard({ 60, 1400, 960, 130 }, 0.35f, theme.neonBlue);
    DrawText(statusText.c_str(), 120, 1445, 36, ColorAlpha(theme.textWhite, 0.8f));

    // Основная кнопка "ЗАБРАТЬ ПРИЗ" (Объемный яркий глянец)
    DrawRectangleRounded({ 60, 1600, 960, 150 }, 0.4f, 8, theme.neonBlue);
    // Накладываем световой блик на кнопку для придания объема
    DrawRectangleRounded({ 60, 1600, 960, 75 }, 0.4f, 8, { 255, 255, 255, 25 });
    
    DrawText("НАЖМИТЕ ДЛЯ ПОЛУЧЕНИЯ ПРИЗА 🚀", 220, 1655, 36, theme.textWhite);

    EndDrawing();
}

int main(void) {
    // Включаем максимальное сглаживание краев MSAA 4x, чтобы убрать пиксельные лесенки на округлостях
    SetConfigFlags(FLAG_MSAA_4X_HINT | FLAG_WINDOW_HIGHDPI);
    InitWindow(screenWidth, screenHeight, "Premium Casino Engine");

    emscripten_set_main_loop(UpdateDrawFrame, 0, 1);

    CloseWindow();
    return 0;
}

