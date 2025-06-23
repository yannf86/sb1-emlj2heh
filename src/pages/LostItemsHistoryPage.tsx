import React from 'react';
import Layout from '../components/Layout/Layout';
import LostItemsHistory from '../components/LostItems/LostItemsHistory';

const LostItemsHistoryPage: React.FC = () => {
  return (
    <Layout title="Historique des objets trouvés">
      <LostItemsHistory />
    </Layout>
  );
};

export default LostItemsHistoryPage;
