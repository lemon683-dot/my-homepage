import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

/**
 * ブクログCSVの全データ型定義
 */
export interface Book {
  // --- 画面でよく使うメイン項目 ---
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

  // --- 今後管理・使用する項目 ---
  serviceId: string;
  itemId: string;
  category: string;
  pubYear: string;
  bookType: string; // タイプ（「本」「電子書籍」等）
  pageCount: string; // ページ数
}

export function getBooks(): Book[] {
  const filePath = path.resolve(process.cwd(), 'src/data/books.csv');

  if (!fs.existsSync(filePath)) {
    console.error(`[getBooks] ファイルが存在しません: ${filePath}`);
    return [];
  }

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    const records = parse(fileContent, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }) as string[][];

    // 1行目がヘッダー行（「サービスID」または「タイトル」が含まれる）ならスキップ
    const dataRows = records[0]?.[0]?.includes('サービスID') || records[0]?.[11]?.includes('タイトル')
      ? records.slice(1) 
      : records;

    return dataRows.map((row, index) => {
      // 提供いただいたCSV列構造（全17列）への正確なマッピング
      // [0] サービスID, [1] アイテムID, [2] 13桁ISBN, [3] カテゴリ,
      // [4] 評価, [5] 読書状況, [6] レビュー, [7] タグ, [8] 読書メモ(非公開),
      // [9] 登録日時, [10] 読了日, [11] タイトル, [12] 作者名, [13] 出版社名,
      // [14] 発行年, [15] タイプ, [16] ページ数
      const rawBook = {
        serviceId: row[0] || '',
        itemId: row[1] || '',
        isbn13: row[2] || '',
        category: row[3] || '',
        rating: row[4] || '',
        status: row[5] || '',
        review: row[6] || '',
        rawTags: row[7] || '',     // タグ (インデックス7)
        memo: row[8] || '',        // 読書メモ (インデックス8)
        regDate: row[9] || '',     // 登録日時 (インデックス9)
        compDate: row[10] || '',   // 読了日 (インデックス10)
        title: row[11] || 'タイトル不明',
        author: row[12] || '著者不明',
        publisher: row[13] || '',
        pubYear: row[14] || '',    // 発行年
        bookType: row[15] || '',   // タイプ (インデックス15)
        pageCount: row[16] || '',  // ページ数 (インデックス16)
      };

      // タグの整形（スペース区切り・カンマ区切りの両方に対応）
      const tagList = rawBook.rawTags
        ? rawBook.rawTags.split(/[\s,]+/).filter(Boolean)
        : [];

      // Kindle判定
      // タグ(rawTags)、タイプ(bookType)、カテゴリ(category)、メモ(memo)のどこかに「kindle」が含まれているか判定
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

        // 将来・追加管理用項目
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