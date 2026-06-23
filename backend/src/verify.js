
const BASE = 'http://localhost:3000/api/products';
const PAGE_SIZE = 500;

async function verify() {
  const seen = new Set();
  let cursor = null;
  let pages = 0;
  let total = 0;
  let duplicates = 0;
  let orderViolations = 0;
  let prevCreatedAt = null;
  let prevId = null;

  const startTime = Date.now();
  console.log(`Verifying pagination consistency (page size: ${PAGE_SIZE})...\n`);

  while (true) {
    const url = new URL(BASE);
    url.searchParams.set('limit', PAGE_SIZE);
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url);
    const body = await res.json();
    pages++;

    for (const doc of body.data) {
      total++;

      if (seen.has(doc._id)) {
        duplicates++;
        if (duplicates <= 5) {
          console.error(`  DUPLICATE: ${doc._id} on page ${pages}`);
        }
      }
      seen.add(doc._id);
      if (prevCreatedAt !== null) {
        const currDate = new Date(doc.created_at).getTime();
        const pDate = new Date(prevCreatedAt).getTime();

        if (currDate > pDate || (currDate === pDate && doc._id > prevId)) {
          orderViolations++;
          if (orderViolations <= 5) {
            console.error(`  ORDER VIOLATION at item ${total}: ${doc.created_at} ${doc._id} came after ${prevCreatedAt} ${prevId}`);
          }
        }
      }
      prevCreatedAt = doc.created_at;
      prevId = doc._id;
    }

    if (pages % 50 === 0) {
      console.log(`  ...page ${pages}, ${total.toLocaleString()} items so far`);
    }

    if (!body.pagination.hasNext) break;
    cursor = body.pagination.nextCursor;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  Pages traversed:    ${pages}`);
  console.log(`  Total items:        ${total.toLocaleString()}`);
  console.log(`  Unique IDs:         ${seen.size.toLocaleString()}`);
  console.log(`  Duplicates:         ${duplicates}`);
  console.log(`  Order violations:   ${orderViolations}`);
  console.log(`  Time:               ${elapsed}s`);
  console.log(`${'═'.repeat(50)}`);

  if (duplicates > 0 || orderViolations > 0) {
    console.log('\n❌ VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ VERIFICATION PASSED — zero duplicates, perfect sort order');
    process.exit(0);
  }
}

verify().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
