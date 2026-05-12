import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const client = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
}));

export default async function handler(req, res) {
  const { access_token } = req.body;
  const now = new Date();
  const start = new Date();
  start.setFullYear(now.getFullYear() - 2);
  const response = await client.transactionsGet({
    access_token,
    start_date: start.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
    options: {
      count: 500,
    },
  });
  res.json(response.data);
}
