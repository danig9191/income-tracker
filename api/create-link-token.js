import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

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
  const response = await client.linkTokenCreate({
    user: { client_user_id: 'user-id' },
    client_name: 'Income Tracker',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });
  res.json(response.data);
}
