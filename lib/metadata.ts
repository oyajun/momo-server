const affiliateId = process.env.RAKUTEN_AFFILIATE_ID;
const applicationId = process.env.RAKUTEN_APPLICATION_ID;

async function getRakutenBooksURLFromISBN(isbn: string) {
  await fetch(
    `https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404?format=json&isbn=${isbn}&applicationId=${applicationId}&affiliateId=${affiliateId}`,
  ).then((response) => {
    response.json().then((data) => {
      console.log("------------------------------------- ");
      console.log(data);
      console.log(data.Items[0].Item);
    });
  });
}

async function getBookInfoFromISBN(
  isbn: string,
): Promise<{ title: string; imageURL: string | null }> {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxAllowedMaturityRating=not-mature`,
  );
  const data = await response.json();
  console.log("------------------------------------- ");
  console.log(data.items[0].volumeInfo.title);
  console.log(data.items[0].volumeInfo.imageLinks.thumbnail);
  return {
    title: data.items[0].volumeInfo.title,
    imageURL: data.items[0].volumeInfo.imageLinks.thumbnail,
  };
}

export { getRakutenBooksURLFromISBN, getBookInfoFromISBN };
