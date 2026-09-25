import fs from 'node:fs';
import path from 'node:path';

/**
 * ブクログCSVの全データ型定義
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  status: string;
  rating: string;
  tags: string[];
  isKindle: boolean;
  review: string;
  memo: string;
  registeredAt: string;
  completedAt: string;
  serviceId: string;
  itemId: string;
  category: string;
  pubYear: string;
  bookType: string;
  pageCount: string;
}

// 簡易CSVパース関数（ダブルクォートや改行を考慮）
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.length > 1 || row[0] !== '') {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) {
    row.push(cell.trim());
    lines.push(row);
  }
  return lines;
}

export function getBooks(): Book[] {
  const filePath = path.resolve(process.cwd(), 'src/data/books.csv');

  if (!fs.existsSync(filePath)) {
    console.error(`[getBooks] ファイルが存在しません: ${filePath}`);
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const records = parseCSV(fileContent);

    // 1行目がヘッダー行ならスキップ
    const dataRows =
      records[0]?.[0]?.includes('サービスID') ||
      records[0]?.[11]?.includes('タイトル')
        ? records.slice(1)
        : records;

    return dataRows.map((row, index) => {
      const rawBook = {
        serviceId: row[0] || '',
        itemId: row[1] || '',
        isbn13: row[2] || '',
        category: row[3] || '',
        rating: row[4] || '',
        status: row[5] || '',
        review: row[6] || '',
        rawTags: row[7] || '',
        memo: row[8] || '',
        regDate: row[9] || '',
        compDate: row[10] || '',
        title: row[11] || 'タイトル不明',
        author: row[12] || '著者不明',
        publisher: row[13] || '',
        pubYear: row[14] || '',
        bookType: row[15] || '',
        pageCount: row[16] || '',
      };

      const tagList = rawBook.rawTags
        ? rawBook.rawTags.split(/[\s,]+/).filter(Boolean)
        : [];

      const checkText = `${rawBook.rawTags} ${rawBook.bookType} ${rawBook.category} ${rawBook.memo}`.toLowerCase();
      const isKindle = checkText.includes('kindle');

      return {
        id: rawBook.isbn13 || rawBook.itemId || `book-${index}`,
        title: rawBook.title,
        author: rawBook.author,
        publisher: rawBook.publisher,
        isbn: rawBook.isbn13,
        status: rawBook.status,
        rating: rawBook.rating,
        tags: tagList,
        isKindle: isKindle,
        review: rawBook.review,
        memo: rawBook.memo,
        registeredAt: rawBook.regDate,
        completedAt: rawBook.compDate,
        serviceId: rawBook.serviceId,
        itemId: rawBook.itemId,
        category: rawBook.category,
        pubYear: rawBook.pubYear,
        bookType: rawBook.bookType,
        pageCount: rawBook.pageCount,
      };
    });
  } catch (error) {
    console.error('[getBooks] CSVパースエラー:', error);
    return [];
  }
}