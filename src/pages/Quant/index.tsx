import React from 'react';
import styles from './index.less';
import { PageContainer } from '@ant-design/pro-components';
import { ConfigProvider,Avatar } from 'antd';
import { Outlet } from 'umi';
import enUS from 'antd/lib/locale/en_US';

export default function Page() {
  return (
    // <ConfigProvider locale={enUS}>
      <PageContainer
      header={{
        breadcrumb: {}
      }}>
        <Outlet />
      </PageContainer>
    // </ConfigProvider>

  );
}
