# 26秒+ 雙語單字學習 PWA

## 部署步驟（約 10 分鐘）

---

### 第一步：取得免費 Gemini API Key

1. 去 [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. 用 Google 帳號登入
3. 點「Create API Key」
4. 複製那串 key（`AIza...` 開頭），先存著備用

> Gemini API 免費方案：每天 1500 次請求、每分鐘 15 次，完全夠個人學習用。

---

### 第二步：建立 GitHub Repository

1. 去 [github.com](https://github.com) 登入（沒帳號先免費註冊）
2. 點右上角 **+** → **New repository**
3. Repository name 填：`vocab-trainer`
4. 選 **Public**
5. 點 **Create repository**

---

### 第三步：上傳這個資料夾

把 `vocab-pwa` 這個資料夾解壓縮後，在終端機執行：

```bash
cd vocab-pwa   # 進入資料夾

git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的帳號/vocab-trainer.git
git push -u origin main
```

> 把「你的帳號」換成你的 GitHub 帳號名稱

---

### 第四步：設定 Gemini API Key

1. 在 GitHub repo 頁面，點上方 **Settings**
2. 左側選單找 **Secrets and variables** → **Actions**
3. 點 **New repository secret**
4. Name 填：`GEMINI_API_KEY`
5. Secret 填入你的 key（`AIza...`）
6. 點 **Add secret**

---

### 第五步：啟用 GitHub Pages

1. 還在 Settings 頁面，左側選 **Pages**
2. Source 選 **GitHub Actions**
3. 儲存

回到 repo 主頁，點 **Actions** 分頁，等 workflow 跑完（綠色勾勾），約 1-2 分鐘。

你的網址：`https://你的帳號.github.io/vocab-trainer/`

---

### 第六步：手機加到主畫面

**iPhone（iOS）：**
1. 用 **Safari** 打開網址
2. 點下方 **分享按鈕**（方塊加箭頭圖示）
3. 選「**加入主畫面**」→「新增」

**Android：**
1. 用 **Chrome** 打開網址
2. 點右上角三點選單
3. 選「**安裝應用程式**」或「加到主畫面」

完成！桌面出現「26秒+」圖示，點開全螢幕使用 🎉

---

### 本地測試（可選）

```bash
npm install
npm run dev
```

打開 http://localhost:5173，但需要先建立 `.env.local`：

```
VITE_GEMINI_API_KEY=你的key
```

---

### 注意事項

- 學習資料存在手機的 localStorage，清除瀏覽器快取會消失，建議定期截圖或匯出
- 離線時無法生成新單字（需要連網），但 SRS 複習、收藏夾、錯題本可以離線使用
- 每次修改程式碼 push 到 main，GitHub Actions 自動重新部署
