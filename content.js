/* Content for Eitan's game. Word lists are the teacher's (prd.md §4.2).
   Days 1 to 3 so far: the 11 ch words, the 12 sh words, and 8 + 12 food words.
   `sent` is a sentence of ours with the word missing, and three words that do not fit it. */
window.CONTENT = {
  startDate: '2026-11-16', // day 1
  testDate: '2026-11-25',
  playerName: 'Eitan', // a name: capital first letter, always

  /* What the stadium says after an answer. {w} is the word. Picked so the same line never comes twice in a row.
     The lines are about the word, never about the player. */
  cheers: {
    combo: {
      3: 'שלושער!', 5: 'חמש ברצף! היציע רועד', 8: 'שמונה ברצף! המילים מבקשות פסק זמן',
      10: 'עשר ברצף! המילים מבקשות חילוף', 15: '15 ברצף! השופט בודק אם זה חוקי', 20: '20 ברצף! האצטדיון שר',
      30: '30 ברצף! המילים מחפשות את היציאה', 40: '40 ברצף! אגדה במגרש', 50: '50 ברצף! אין מילים. באמת, לא נשארו',
    },
    head: {
      recognise: ['נחשפה!', 'התחפושת נפלה!', 'זוהתה!', 'אין לה איפה להתחבא!', 'נתפסה על חם!'],
      whistle: ['אוזן של שופט!', 'שריקה מדויקת!', 'נשמע עד היציע!', 'האוזן לא מפספסת!', 'שומעים הכול!'],
      missing: ['האותיות חזרו הביתה!', 'סגירה הרמטית!', 'החור נסתם!', 'בדיוק במקום!', 'המילה שלמה שוב!'],
      bank: ['נשלפה מהמחסן!', 'בחירה של קפטן!', 'נמצאה בין כולן!', 'הוצאה מהשורה!', 'אין לה לאן לברוח!'],
      sentence: ['המשפט שלם!', 'מסירה מדויקת!', 'נכנסה בדיוק לרווח!', 'המשפט סגור!', 'חיבור מושלם!'],
      spell: ['גוווול!', 'ישר לחיבורים!', 'רשת!', 'פנדל מושלם!', 'השוער אפילו לא זז!', 'בעיטה של קפטן!'],
    },
    sub: [
      '{w} בפנים.', '{w} לא ראתה את זה בא.', '{w} ניסתה להתחמק. לא הלך לה.', '{w} עוד מחפשת את הכדור.',
      '{w} על הדשא. הבאה בתור!', '{w} הרימה ידיים.', '{w} מבקשת VAR. אין לה סיכוי.', '{w} חוזרת לספסל.',
      'המאמן של {w} תופס את הראש.', '{w} מעמידה פנים שזה לא קרה.', 'הקהל שר, {w} שותקת.', '{w} רצה להתלונן לשופט.',
    ],
    slip: ['{w} חמקה!', '{w} התחמקה ברגע האחרון!', '{w} ברחה לקו האמצע!', '{w} קנתה לעצמה עוד סיבוב!', '{w} עשתה תרגיל הטעיה!'],
  },

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
    { id: 'chicken', en: 'chicken', he: 'תרנגולת / עוף', emoji: '🐔', blend: 'ch', day: 1, line: 'מתחבאת מאחורי השער ומקרקרת בשקט.', sent: ['Eggs come from a ___.', ['chair', 'shirt', 'school']] },
    { id: 'chips', en: 'chips', he: "צ'יפס", emoji: '🍟', blend: 'ch', day: 1, line: 'חושבת שהיא פריכה מדי בשביל להיתפס.', sent: ['I eat a hamburger and ___.', ['shoes', 'chair', 'school']] },
    { id: 'chocolate', en: 'chocolate', he: 'שוקולד', emoji: '🍫', blend: 'ch', day: 1, line: 'ארוכה, מתוקה, וכבר נמסה מלחץ.', sent: ['I drink a ___ milkshake. It is brown.', ['fish', 'spinach', 'chair']] },
    { id: 'sandwich', en: 'sandwich', he: 'כריך', emoji: '🥪', blend: 'ch', day: 1, line: 'מחביאה את ה-ch שלה בסוף, בין שתי פרוסות.', sent: ['I make a ___ with bread and cheese.', ['milkshake', 'shirt', 'chair']] },
    { id: 'cheese', en: 'cheese', he: 'גבינה', emoji: '🧀', blend: 'ch', day: 1, line: 'מלאה חורים. גם ההגנה שלה.', sent: ['A mouse likes to eat ___.', ['shoes', 'chair', 'school']] },
    { id: 'chair', en: 'chair', he: 'כיסא', emoji: '🪑', blend: 'ch', day: 1, line: 'יושבת על הספסל ומקווה שלא ישימו לב אליה.', sent: ['I sit on a ___.', ['cheese', 'fish', 'sandwich']] },
    { id: 'teacher', en: 'teacher', he: 'מורה', emoji: '🧑‍🏫', blend: 'ch', day: 1, line: 'מסתירה את ה-ch באמצע ועושה פרצוף רציני.', sent: ['My ___ is at school with the children.', ['chicken', 'kitchen', 'sandwich']] },
    { id: 'children', en: 'children', he: 'ילדים', emoji: '🧒', blend: 'ch', day: 1, line: 'רצה במגרש בכל הכיוונים וצועקת.', sent: ['The ___ play at school.', ['chips', 'shoes', 'cheese']] },
    { id: 'kitchen', en: 'kitchen', he: 'מטבח', emoji: '🍳', blend: 'ch', day: 1, line: 'מרעישה בסירים כדי לבלבל.', sent: ['Mum makes food in the ___.', ['chair', 'sheep', 'shirt']] },
    { id: 'spinach', en: 'spinach', he: 'תרד', emoji: '🥬', blend: 'ch', day: 1, line: 'ירוקה מפחד. ה-ch שלה בסוף.', sent: ['___ is a green vegetable.', ['chocolate', 'cheese', 'chicken']] },
    { id: 'school', en: 'school', he: 'בית ספר', emoji: '🏫', blend: 'ch', silent: true, day: 1, line: 'מתחכמת: ה-ch שלה מתחפש ונשמע כמו k. כותבים אותה עם ch בכל זאת.', sent: ['The teacher and the children are at ___.', ['brush', 'sheep', 'chips']] },
    // day 2: the 12 sh words and the first 8 food words
    { id: 'milkshake', en: 'milkshake', he: 'מילקשייק', emoji: '🥤', blend: 'sh', day: 2, line: 'מסתחררת בכוס עד שהיא מסוחררת בעצמה.', sent: ['I drink a chocolate ___.', ['sandwich', 'shirt', 'fish']] },
    { id: 'share', en: 'share', he: 'לחלוק / לשתף', emoji: '🤝', blend: 'sh', day: 2, line: 'לא מוכנה לחלוק את הכדור עם אף אחד.', sent: ['I ___ my chips with a friend.', ['wash', 'short', 'sheep']] },
    { id: 'shop', en: 'shop', he: 'לקנות / חנות', emoji: '🏪', blend: 'sh', day: 2, line: 'מנסה למכור לשופט כרטיס צהוב במבצע.', sent: ['We buy food in a ___.', ['brush', 'sheep', 'shirt']] },
    { id: 'short', en: 'short', he: 'קצר / נמוך', emoji: '📏', blend: 'sh', day: 2, line: 'קצרה, ובטוחה שלא יראו אותה מאחורי הדשא.', sent: ['He is not tall. He is ___.', ['fish', 'shop', 'wash']] },
    { id: 'wash', en: 'wash', he: 'לשטוף / לרחוץ', emoji: '🧼', blend: 'sh', day: 2, line: 'מלאה קצף ומחליקה על המגרש.', sent: ['I ___ my hands with water.', ['share', 'shop', 'short']] },
    { id: 'fish', en: 'fish', he: 'דג / דגים', emoji: '🐟', blend: 'sh', day: 2, line: 'שותקת כמו דג. ה-sh שלה בסוף.', sent: ['A ___ lives in water.', ['sheep', 'chair', 'shirt']] },
    { id: 'shopping', en: 'shopping', he: 'קניות', emoji: '🛒', blend: 'sh', day: 2, line: 'דוחפת עגלה באמצע המגרש וחוסמת את כולם.', sent: ['Mum has a ___ list.', ['sheep', 'shoes', 'short']] },
    { id: 'brush', en: 'brush', he: 'מברשת', emoji: '🪥', blend: 'sh', day: 2, line: 'מצחצחת את עצמה במקום לשמור על השער.', sent: ['I clean my shoes with a ___.', ['sheep', 'shop', 'fish']] },
    { id: 'sheep', en: 'sheep', he: 'כבשה', emoji: '🐑', blend: 'sh', day: 2, line: 'סופרת את עצמה ונרדמת על הקו.', sent: ['A ___ is an animal. It says baa.', ['shirt', 'shoes', 'chair']] },
    { id: 'shirt', en: 'shirt', he: 'חולצה', emoji: '👕', blend: 'sh', day: 2, line: 'מקופלת יפה בארון ומקווה שתישאר שם.', sent: ['I wear a ___ and shorts.', ['sheep', 'fish', 'chair']] },
    { id: 'shorts', en: 'shorts', he: 'מכנסיים קצרים', emoji: '🩳', blend: 'sh', day: 2, line: 'כמעט כמו short, רק עם s בסוף. תאומות שמנסות לבלבל.', sent: ['It is hot. I wear ___.', ['short', 'sheep', 'cheese']] },
    { id: 'shoes', en: 'shoes', he: 'נעליים', emoji: '👟', blend: 'sh', day: 2, line: 'קשרה את השרוכים שלה זה לזה. בהצלחה לה.', sent: ['I wear ___ on my feet.', ['shirt', 'chips', 'sheep']] },
    { id: 'pizza', en: 'pizza', he: 'פיצה', emoji: '🍕', day: 2, line: 'עגולה, חמה, ומסתובבת סביב עצמה.', sent: ['I eat ___ with cheese on top.', ['water', 'milk', 'shoes']] },
    { id: 'bread', en: 'bread', he: 'לחם', emoji: '🍞', day: 2, line: 'פרוסה אחרי פרוסה, ההגנה שלה מתפוררת.', sent: ['I make a sandwich with ___.', ['water', 'shirt', 'chair']] },
    { id: 'eggs', en: 'eggs', he: 'ביצים', emoji: '🥚', day: 2, line: 'שבירה מאוד. היא יודעת את זה.', sent: ['A chicken makes ___.', ['shoes', 'bread', 'chips']] },
    { id: 'milk', en: 'milk', he: 'חלב', emoji: '🥛', day: 2, line: 'נשפכת מלחץ עוד לפני השריקה.', sent: ['I make a milkshake with ___.', ['bread', 'fish', 'chips']] },
    { id: 'water', en: 'water', he: 'מים', emoji: '💧', day: 2, line: 'מנסה לחמוק בין האצבעות.', sent: ['I wash my hands with ___.', ['bread', 'cake', 'eggs']] },
    { id: 'apples', en: 'apples', he: 'תפוחים', emoji: '🍎', day: 2, line: 'מתגלגלת לכל הכיוונים כדי לא להיתפס.', sent: ['___ are red fruit.', ['bananas', 'eggs', 'chips']] },
    { id: 'bananas', en: 'bananas', he: 'בננות', emoji: '🍌', day: 2, line: 'משאירה קליפות על הדשא. תכסיס ישן.', sent: ['___ are yellow fruit.', ['apples', 'eggs', 'shoes']] },
    { id: 'cake', en: 'cake', he: 'עוגה', emoji: '🍰', day: 2, line: 'מתוקה מבחוץ, לחוצה מבפנים.', sent: ['We eat ___ at a birthday party.', ['water', 'chair', 'sheep']] },
    // day 3: 12 food words (the colour-sort ones first). Colours and prepositions come with the Kit room, not as cards here.
    // The other 18 food words, the verbs and the phrases move to day 4 (split decided 17 Nov: day 3 was too heavy).
    { id: 'lemon', en: 'lemon', he: 'לימון', emoji: '🍋', day: 3, line: 'חמוצה כל כך שהיא עושה פרצוף לעצמה במראה.', sent: ['A ___ is yellow and sour.', ['chair', 'shirt', 'sheep']] },
    { id: 'tomatoes', en: 'tomatoes', he: 'עגבניות', emoji: '🍅', day: 3, line: 'אדומה מהתרגשות, ומתגלגלת לפינה כדי להתחבא.', sent: ['I put red ___ in the salad.', ['shoes', 'chair', 'brush']] },
    { id: 'cookie', en: 'cookie', he: 'עוגיה', emoji: '🍪', day: 3, line: 'מתפוררת מלחץ בכל פעם שמסתכלים עליה.', sent: ['I eat a ___ with my milk.', ['shoes', 'chair', 'brush']] },
    { id: 'oranges', en: 'oranges', he: 'תפוזים', emoji: '🍊', day: 3, line: 'מתגלגלת לכיוון הקורנר ומקווה שלא יספרו אותה.', sent: ['___ are orange fruit.', ['bananas', 'eggs', 'chair']] },
    { id: 'juice', en: 'juice', he: 'מיץ', emoji: '🧃', day: 3, line: 'סחוטה לגמרי אחרי המחצית הראשונה.', sent: ['I drink orange ___ in the morning.', ['shirt', 'chair', 'bread']] },
    { id: 'salad', en: 'salad', he: 'סלט', emoji: '🥗', day: 3, line: 'מעורבבת כל כך שאף אחד לא יודע איפה היא מתחילה.', sent: ['I eat a ___ with tomatoes.', ['shirt', 'chair', 'shoes']] },
    { id: 'meat', en: 'meat', he: 'בשר', emoji: '🥩', day: 3, line: 'קשוחה, אבל נכנעת מול מזלג אחד.', sent: ['A hamburger is made of ___.', ['water', 'cake', 'bananas']] },
    { id: 'hamburger', en: 'hamburger', he: 'המבורגר', emoji: '🍔', day: 3, line: 'מתחבאת בין שתי לחמניות ומקווה שיחשבו שהיא כריך.', sent: ['I eat a ___ with chips.', ['shirt', 'chair', 'milk']] },
    { id: 'jam', en: 'jam', he: 'ריבה', emoji: '🍓', day: 3, line: 'דביקה, ונצמדת לכל מי שעובר לידה.', sent: ['I put ___ on my bread.', ['shoes', 'fish', 'chair']] },
    { id: 'carrots', en: 'carrots', he: 'גזרים', emoji: '🥕', day: 3, line: 'כתומה, ארוכה, ובטוחה שהארנבים לא יזהו אותה.', sent: ['___ are orange vegetables.', ['apples', 'shoes', 'cake']] },
    { id: 'tea', en: 'tea', he: 'תה', emoji: '🍵', day: 3, line: 'שקטה בתוך הכוס ומחכה שיפסיקו להסתכל.', sent: ['I drink hot ___ with lemon.', ['shirt', 'bread', 'chair']] },
    { id: 'coffee', en: 'coffee', he: 'קפה', emoji: '☕', day: 3, line: 'ערה כל הלילה ומרעידה את הכוס.', sent: ['My dad drinks ___ in the morning.', ['shirt', 'bread', 'chair']] },
  ],

  /* The table. Clubs of ours: a football word every child knows, and a word from the test.
     Real Madrid is the rival of the Clásico. `rate` = points a club makes for every answer he gives. */
  myClub: 'Barcelona',
  clubs: [
    { name: 'Real Madrid', rate: 20 },
    { name: 'Maccabi Milkshake', rate: 17 },
    { name: 'Hapoel Chicken', rate: 15 },
    { name: 'Inter Sandwich', rate: 13 },
    { name: 'Beitar Cheese', rate: 11 },
    { name: 'Sheep United', rate: 9 },
    { name: 'Chips City', rate: 7 },
    { name: 'FC Spinach', rate: 5 },
  ],

  // sh words heard only, never shown before the answer, so the Whistle is a real choice on day 1 (before the sh words arrive).
  foils: ['sheep', 'shop', 'shirt', 'shoes', 'fish', 'brush', 'wash', 'short'],

  /* The official 2026/27 squad as listed on LALIGA's club page (laliga.com/en-GB/clubs/fc-barcelona/squad),
     from the owner's printout of 16 Nov 2026. Names as text only. */
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
    { name: 'Andreas Christensen', number: 15 },
    { name: 'Rodrigo', number: 16 },
    { name: 'Anthony Gordon', number: 17 },
    { name: 'Gerard Martín', number: 18 },
    { name: 'Roony Bardghji', number: 19 },
    { name: 'Dani Olmo', number: 20 },
    { name: 'Frenkie de Jong', number: 21 },
    { name: 'Marc Bernal', number: 22 },
    { name: 'Jules Koundé', number: 23 },
    { name: 'Eric García', number: 24 },
    { name: 'Dominik Livaković', number: 25 },
    { name: 'Cortés', number: 26 },
    { name: 'Hamza Abdelkarim', number: 29 },
    { name: 'Ebrima Tunkara', number: 30 },
    { name: 'Eder Aller', number: 31 },
    { name: 'Orian Goren', number: 32 },
    { name: 'Jordi Pesquer', number: 33 },
    { name: 'Iker Rodríguez', number: 35 },
    { name: 'Guillem Víctor', number: 40 },
    { name: 'Álex Campos', number: 41 },
  ],
};
