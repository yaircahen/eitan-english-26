/* Content for Eitan's game. Word lists are the teacher's (prd.md §4.2).
   M1 carries day 1 only: the 11 ch words. */
window.CONTENT = {
  startDate: '2026-11-16', // day 1
  testDate: '2026-11-25',
  playerName: 'EITAN',

  levels: ['', 'חדשה', 'מתחממת', 'בסגל', 'בהרכב', 'אגדה'],

  stages: [
    { name: 'מבחני האקדמיה', from: 0 },
    { name: 'קבוצת הנוער', from: 1 },
    { name: 'הקבוצה הראשונה', from: 3 },
    { name: 'ליל ליגת האלופות', from: 6 },
    { name: 'הקלאסיקו', from: 8 },
  ],

  // `line` is the word's entrance: the humor is on the word, never on the player.
  words: [
    { id: 'chicken', en: 'chicken', he: 'תרנגולת / עוף', emoji: '🐔', blend: 'ch', day: 1, line: 'מתחבאת מאחורי השער ומקרקרת בשקט.' },
    { id: 'chips', en: 'chips', he: "צ'יפס", emoji: '🍟', blend: 'ch', day: 1, line: 'חושבת שהיא פריכה מדי בשביל להיתפס.' },
    { id: 'chocolate', en: 'chocolate', he: 'שוקולד', emoji: '🍫', blend: 'ch', day: 1, line: 'ארוכה, מתוקה, וכבר נמסה מלחץ.' },
    { id: 'sandwich', en: 'sandwich', he: 'כריך', emoji: '🥪', blend: 'ch', day: 1, line: 'מחביאה את ה-ch שלה בסוף, בין שתי פרוסות.' },
    { id: 'cheese', en: 'cheese', he: 'גבינה', emoji: '🧀', blend: 'ch', day: 1, line: 'מלאה חורים. גם ההגנה שלה.' },
    { id: 'chair', en: 'chair', he: 'כיסא', emoji: '🪑', blend: 'ch', day: 1, line: 'יושבת על הספסל ומקווה שלא ישימו לב אליה.' },
    { id: 'teacher', en: 'teacher', he: 'מורה', emoji: '🧑‍🏫', blend: 'ch', day: 1, line: 'מסתירה את ה-ch באמצע ועושה פרצוף רציני.' },
    { id: 'children', en: 'children', he: 'ילדים', emoji: '🧒', blend: 'ch', day: 1, line: 'רצה במגרש בכל הכיוונים וצועקת.' },
    { id: 'kitchen', en: 'kitchen', he: 'מטבח', emoji: '🍳', blend: 'ch', day: 1, line: 'מרעישה בסירים כדי לבלבל.' },
    { id: 'spinach', en: 'spinach', he: 'תרד', emoji: '🥬', blend: 'ch', day: 1, line: 'ירוקה מפחד. ה-ch שלה בסוף.' },
    { id: 'school', en: 'school', he: 'בית ספר', emoji: '🏫', blend: 'ch', silent: true, day: 1, line: 'מתחכמת: ה-ch שלה מתחפש ונשמע כמו k. כותבים אותה עם ch בכל זאת.' },
  ],

  // sh words from the teacher's list, heard only (never shown before the answer), so the Whistle is a real choice on day 1.
  foils: ['sheep', 'shop', 'shirt', 'shoes', 'fish', 'brush', 'wash', 'short'],

  /* The 2026/27 first-team numbers as announced by the club (found via web search on 16 Nov 2026).
     Names as text only. The owner confirms this list before publishing (prd.md §11.3). */
  idols: [
    { name: 'Joan García', number: 1 },
    { name: 'João Cancelo', number: 2 },
    { name: 'Alejandro Balde', number: 3 },
    { name: 'Brian Fariñas', number: 4 },
    { name: 'Pau Cubarsí', number: 5 },
    { name: 'Gavi', number: 6 },
    { name: 'Fermín López', number: 7 },
    { name: 'Pedri', number: 8 },
    { name: 'Gabriel Jesus', number: 9 },
    { name: 'Lamine Yamal', number: 10 },
    { name: 'Raphinha', number: 11 },
    { name: 'Xavi Espart', number: 12 },
    { name: 'Wojciech Szczęsny', number: 13 },
    { name: 'Karim Adeyemi', number: 14 },
    { name: 'Rodrigo', number: 16 },
    { name: 'Anthony Gordon', number: 17 },
    { name: 'Roony Bardghji', number: 19 },
    { name: 'Dani Olmo', number: 20 },
    { name: 'Frenkie de Jong', number: 21 },
    { name: 'Marc Bernal', number: 22 },
    { name: 'Dominik Livaković', number: 25 },
    { name: 'Jesse Bisiwu', number: 27 },
    { name: 'Hamza Abdelkarim', number: 29 },
  ],
};
