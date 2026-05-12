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
  const { public_token } = req.body;
  const response = await client.itemPublicTokenExchange({ public_token });
  res.json({ access_token: response.data.access_token });
}
