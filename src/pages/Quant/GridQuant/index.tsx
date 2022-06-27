import React, { useState, useEffect, useRef } from 'react';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  ProCard, ProForm, ProDescriptions, StatisticCard, ProList,
  ProTable, ProFormSelect, ProFormSlider, ProFormMoney
} from '@ant-design/pro-components';
import { Typography, Collapse, Row, Col } from 'antd';
import Decimal from 'decimal.js';
import styles from './index.less';
import FormItem from 'antd/lib/form/FormItem';
import { layout } from '@/app';
const { Text } = Typography;
type QuanGridParam = {
  p0: number,
  ph: number,
  pl: number,
  n: number,
  a: number,
  f: number,
  u: number,
  // k: Number,
  ps0: number,
  pb0: number
}

type QuanGridResult = {
  I: number, // 初始总投入
  h: number, // 空单数量
  s: number, // 建仓卖单数量
  b: number, // 建仓买单数量
  C: number, // 建仓成本
  Cs: number, // 建仓的卖单手续费
  Ch: number, // 建仓的合约费用
  Cc: number, // 建仓费用
  Pt: number, // 空单在地线平仓收益
  Bf: number, // 多单成交手续费
  hedgefl: number, // 空单地线平仓手续费
  hedgefh: number, // 空单天线平仓手续费
  Vl: number, //平仓市值
  Dh: number, // 空单在天线平仓亏损
  Vh: number, // 天线位置的多单市值
  Cdh: number, // 到达天线时，累计多单成交的费用
  Cdr: number, // 无对冲时，到达天线时的交易费用
  Cts: number, // 击穿天线卖单手续费 
  Ctb: number, // 击穿地线买单手续费
}

type OrderItem = {
  price: number, // 挂单金额
  type: string, // s 卖单, b买单, c开仓价
  real: boolean, // true 真实下单
}

export default function Page() {
  const [gridParams, setGridParams] = useState<QuanGridParam | null>(null);
  const [gridResult, setGridResult] = useState<QuanGridResult>({
    I: 0,
    h: 0,
    s: 0,
    b: 0,
    C: 0,
    Cs: 0,
    Ch: 0,
    Cc: 0,
    Pt: 0,
    Bf: 0,
    hedgefl: 0,
    hedgefh: 0,
    Vl: 0,
    Dh: 0,
    Vh: 0,
    Cdh: 0,
    Cdr: 0,
    Cts: 0,
    Ctb: 0,
  });
  const [gridOrders, setGridOrders] = useState<Array<OrderItem>>([]);
  const descRef = useRef<ActionType>();
  const [riskForm] = ProForm.useForm();
  const columns: ProColumns[] = [
    {
      title: '开仓价格',
      dataIndex: 'p0',
      valueType: (item: any) => ({
        type: "money",
        locale: "en-US"
      }),
      fieldProps: {
        style: {
          width: 150
        }
      },
      formItemProps: {
        rules: [{
          required: true,
          message: '必须输入开仓价格'
        }]
      },
    },
    {
      title: '天线价格',
      dataIndex: 'ph',
      valueType: (item: any) => ({
        type: "money",
        locale: "en-US"
      }),
      fieldProps: {
        style: {
          width: 150
        }
      },
      formItemProps: {
        rules: [{
          required: true,
          message: '必须输入天线价格'
        }]
      },
      renderFormItem: (schema, config, form, action?) => {
        const p0 = form.getFieldValue('p0');
        const ph = form.getFieldValue('ph');
        let help = "";
        if (typeof p0 === "number" && typeof ph === "number") {
          help = "相对开仓价上浮" + (((ph - p0) / p0) * 100).toFixed(2) + "%"
        }
        return <ProFormMoney
          name="ph"
          extra={help}
        />
      },
      render: (dom, entity) => {
        return <Text><Text>{`$${dom}`}</Text><Text type="danger">{`(上浮${((entity.ph - entity.p0) * 100 / entity.p0).toFixed(4)}%)`}</Text></Text>
      },

    },
    {
      title: '地线价格',
      dataIndex: 'pl',
      valueType: (item: any) => ({
        type: "money",
        locale: "en-US"
      }),
      fieldProps: {
        style: {
          width: 150
        }
      },
      formItemProps: {
        rules: [{
          required: true,
          message: '必须输入地线价格'
        }]
      },
      renderFormItem: (schema, config, form, action?) => {
        const p0 = form.getFieldValue('p0');
        const pl = form.getFieldValue('pl');
        let help = "";
        if (typeof p0 === "number" && typeof pl === "number") {
          help = "相对开仓价下浮" + (((p0 - pl) / p0) * 100).toFixed(2) + "%"
        }
        return <ProFormMoney
          name="pl"
          extra={help}
        />
      },
      render: (dom, entity) => {
        return <Text><Text>{`$${dom}`}</Text><Text type="success">{`(下浮${((entity.p0 - entity.pl) * 100 / entity.p0).toFixed(4)}%)`}</Text></Text>
      },

    },
    // {
    //   title: '买一价格',
    //   dataIndex: 'pb0',
    //   valueType: (item: any) => ({
    //     type: "money",
    //     locale: "en-US"
    //   }),
    //   hideInForm: true
    // },
    // {
    //   title: '卖一价格',
    //   dataIndex: 'ps0',
    //   valueType: (item: any) => ({
    //     type: "money",
    //     locale: "en-US"
    //   }),
    //   hideInForm: true
    // },
    {
      title: '格子总数',
      dataIndex: 'n',
      valueType: "digit",
      fieldProps: {
        min: 3,
        max: 500,
        style: {
          width: 150
        }
      },
      formItemProps: {
        rules: [{
          required: true,
          message: '必须输入格子总数'
        }]
      },

    },
    {
      title: '单位交易量(对应现货数量)',
      dataIndex: 'a',
      valueType: "digit",
      fieldProps: {
        min: 0,
        precision: 5,
        style: {
          width: 150
        }
      },
      formItemProps: {
        rules: [{
          required: true,
          message: '必须输入单位现货交易量'
        }]
      },
    },
    {
      title: '单格金额',
      dataIndex: 'u',
      valueType: (item: any) => ({
        type: "money",
        locale: "en-US"
      }),
      fieldProps: {
        min: 0,
        precision: 5,
        style: {
          width: 150
        }
      },
      hideInForm: true,
    },
    {
      title: '交易费率',
      dataIndex: 'f',
      valueType: "digit",
      hideInForm: true,
      fieldProps: {
        precision: 5
      }
    },
  ]

  const onGridParamFinish = async (values: QuanGridParam) => {
    console.log('input values', values);
    let params: QuanGridParam = {
      ...values
    }
    let u: number = (params.ph - params.pl) / params.n;
    // let ps0: number = params.p0 + ((params.ph - params.p0) / u - Math.floor((params.ph - params.p0) / u))*u;
    let ps0: number = params.p0 + (params.ph - params.p0) % u;
    // if (ps0 === params.p0) {
    //   ps0 = params.p0 + u;
    // }
    let pb0: number = params.p0 - ((params.p0 - params.pl) / u - Math.floor((params.p0 - params.pl) / u))*u;
    if (pb0 === params.p0) {
      pb0 = params.p0 - u;
    }
    console.log('ps0, pb0',ps0,pb0);
    params.ps0 = ps0;
    params.pb0 = pb0;
    params.u = (params.ph - params.pl) / params.n;
    params.f = 0.00018;
    console.log('params', params);
    setGridParams(params);
  }

  const onRiskModeChanged = (changedValues: any, allValues: any) => {
    console.log('onRiskModeChanged', allValues);
    if (!!gridParams?.p0) {
      calculateGrid();
    }
  }

  useEffect(() => {
    if (descRef.current) {
      descRef.current.reload();
      if (!!gridParams?.p0) {
        calculateGrid();
      }
    }
  }, [gridParams])

  const calculateGrid = () => {
    let params: QuanGridParam;

    let p0 = gridParams?.p0 ?? 0, ph = gridParams?.ph ?? 0, ps0 = gridParams?.ps0 ?? 0, pl = gridParams?.pl ?? 0,
      pb0 = gridParams?.pb0 ?? 0, n = gridParams?.n ?? 0, a = gridParams?.a ?? 0, f = gridParams?.f ?? 0;
    let u: number = (ph - pl) / n;
    let riskMode = riskForm.getFieldsValue(true);
    let kk = parseInt(riskMode.k);

    let h: number = 0;
    // if (kk === 0) {
    //   h = (-1 * a ** 3 * f * n * pl ** 2 + 2 * a ** 3 * f * n * pl * ps0 - a ** 3 * f * n * ps0 ** 2 - 2 * a ** 3 * n * pb0 * pl + 2 * a ** 3 * n * pb0 * ps0 + 2 * a ** 3 * n * ph * pl - 2 * a ** 3 * n * ph * ps0 - 3 * a ** 3 * n * pl ** 2 + 6 * a ** 3 * n * pl * ps0 - 3 * a ** 3 * n * ps0 ** 2 + 2 * a ** 2 * f * n * p0 * pb0 - 2 * a ** 2 * f * n * p0 * ph + 2 * a ** 2 * f * n * pb0 * pl - 2 * a ** 2 * f * n * pb0 * ps0 - a ** 2 * f * ph * pl + a ** 2 * f * ph * ps0 + a ** 2 * f * pl ** 2 - a ** 2 * f * pl * ps0 + 2 * a ** 2 * n * p0 * pb0 - 2 * a ** 2 * n * p0 * ph + 2 * a ** 2 * n * pb0 * pl - 4 * a ** 2 * n * pb0 * ps0 + 2 * a ** 2 * n * ph * ps0 - 2 * a ** 2 * n * pl * ps0 + 2 * a ** 2 * n * ps0 ** 2 - a ** 2 * ph * pl + a ** 2 * ph * ps0 + a ** 2 * pl ** 2 - a ** 2 * pl * ps0) / (2 * f * p0 * ph - 2 * f * p0 * pl + 2 * f * ph * pl - 2 * f * pl ** 2 - 2 * p0 * ph + 2 * p0 * pl + 2 * ph * pl - 2 * pl ** 2);
    // } else 
    if (kk === 100) {
      h = (2 * a * f * n * p0 * pb0 - 2 * a * f * n * p0 * ph - a * f * n * pb0 ** 2 + 2 * a * f * n * pb0 * ph + 2 * a * f * n * pb0 * ps0 - a * f * n * ph ** 2 - 2 * a * f * n * ph * ps0 + 2 * a * f * p0 * ph - 2 * a * f * p0 * pl - a * f * pb0 * ph + a * f * pb0 * pl + a * f * ph ** 2 - a * f * ph * pl + 2 * a * f * ph * ps0 - 2 * a * f * pl * ps0 + 2 * a * n * p0 * pb0 - 2 * a * n * p0 * ph + a * n * pb0 ** 2 - 2 * a * n * pb0 * ph - 2 * a * n * pb0 * ps0 + a * n * ph ** 2 + 2 * a * n * ph * ps0 + 2 * a * p0 * ph - 2 * a * p0 * pl + a * pb0 * ph - a * pb0 * pl - a * ph ** 2 + a * ph * pl - 2 * a * ph * ps0 + 2 * a * pl * ps0) / (2 * f * p0 * ph - 2 * f * p0 * pl + 2 * f * ph ** 2 - 2 * f * ph * pl - 2 * p0 * ph + 2 * p0 * pl + 2 * ph ** 2 - 2 * ph * pl);
    } else {
      let k: number = kk / (100 - kk);
      h = (2 * a * f * k * n * p0 * pb0 - 2 * a * f * k * n * p0 * ph - a * f * k * n * pb0 ** 2 + 2 * a * f * k * n * pb0 * ph + 2 * a * f * k * n * pb0 * ps0 - a * f * k * n * ph ** 2 - 2 * a * f * k * n * ph * ps0 + 2 * a * f * k * p0 * ph - 2 * a * f * k * p0 * pl - a * f * k * pb0 * ph + a * f * k * pb0 * pl + a * f * k * ph ** 2 - a * f * k * ph * pl + 2 * a * f * k * ph * ps0 - 2 * a * f * k * pl * ps0 - 2 * a * f * n * p0 * pb0 + 2 * a * f * n * p0 * ph - a * f * n * pl ** 2 + a * f * n * ps0 ** 2 - 2 * a * f * p0 * ph + 2 * a * f * p0 * pl + a * f * ph * pl - a * f * ph * ps0 - a * f * pl ** 2 + a * f * pl * ps0 + 2 * a * k * n * p0 * pb0 - 2 * a * k * n * p0 * ph + a * k * n * pb0 ** 2 - 2 * a * k * n * pb0 * ph - 2 * a * k * n * pb0 * ps0 + a * k * n * ph ** 2 + 2 * a * k * n * ph * ps0 + 2 * a * k * p0 * ph - 2 * a * k * p0 * pl + a * k * pb0 * ph - a * k * pb0 * pl - a * k * ph ** 2 + a * k * ph * pl - 2 * a * k * ph * ps0 + 2 * a * k * pl * ps0 - 2 * a * n * p0 * pb0 + 2 * a * n * p0 * ph + 2 * a * n * pb0 * pl - 2 * a * n * ph * pl + a * n * pl ** 2 - 2 * a * n * pl * ps0 + a * n * ps0 ** 2 - 2 * a * p0 * ph + 2 * a * p0 * pl + 3 * a * ph * pl - a * ph * ps0 - 3 * a * pl ** 2 + a * pl * ps0) / (2 * f * k * p0 * ph - 2 * f * k * p0 * pl + 2 * f * k * ph ** 2 - 2 * f * k * ph * pl - 2 * f * p0 * ph + 2 * f * p0 * pl - 2 * f * ph * pl + 2 * f * pl ** 2 - 2 * k * p0 * ph + 2 * k * p0 * pl + 2 * k * ph ** 2 - 2 * k * ph * pl + 2 * p0 * ph - 2 * p0 * pl - 2 * ph * pl + 2 * pl ** 2);
    }

    console.log('h:', h);
    let s: number = ((ph - pb0) / u) - 1;
    let b: number = (ps0 - pl) / u;
    let sa: number = s * a;
    let ba: number = b * a;
    let C: number = p0 * sa + a * (pl * b + b * (b - 1) * u / 2);
    let Cc: number = (sa + h) * p0 * f;
    let I: number = C + Cc + h * p0 + h * p0 * f;

    let orderList: Array<OrderItem> = [];

    for (let pr = gridParams?.ph ?? 0; pr >= (gridParams?.ps0 ?? 0); pr -= gridParams?.u ?? 0) {
      orderList.push({
        price: pr,
        type: "s",
        real: true
      })
    };
    orderList[orderList.length - 1].real = false;
    if ((gridParams?.ps0 ?? 0) > (gridParams?.p0 ?? 0)) {
      orderList.push({
        price: gridParams?.p0 ?? 0,
        type: "c",
        real: false
      })
    } else {
      orderList[orderList.length - 1].type="cs";
    }
    for (let pr = gridParams?.pb0 ?? 0; pr >= (gridParams?.pl ?? 0); pr -= gridParams?.u ?? 0) {
      orderList.push({
        price: pr,
        type: "b",
        real: true
      })
    }

    console.log('order list', orderList);
    setGridOrders(orderList);
    setGridResult({
      I,
      h,
      s: sa,
      b: ba,
      C,
      Cs: sa * p0 * f,
      Ch: h * p0 * f,
      Cc,
      Pt: h * (p0 - pl),
      Bf: (pl * b + b * (b - 1) * u / 2) * a * f,
      hedgefl: h * pl * f,
      hedgefh: h * ph * f,
      Vl: a * (s + b) * (ps0 - b * u),
      Dh: h * (ph - p0),
      Vh: a * ((ps0 + u) * s + s * (s - 1) * u / 2 + pl * b + b * (b - 1) * u / 2),
      Cdh: h * ph * f + a * ((ps0 + u) * s + s * (s - 1) * u / 2) * f,
      Cdr: a * ((ps0 + u) * s + s * (s - 1) * u / 2) * f,
      Cts: a * ((ps0 + u) * s + s * (s - 1) * u / 2) * f,
      Ctb: (pl * b + b * (b - 1) * u / 2) * a * f,
    });
  }


  return (
    <ProCard

      split="horizontal"
      bordered
      headerBordered
    >
      <ProCard split="horizontal">
        <ProCard>
          <Collapse>
            <Collapse.Panel key="grid-params-input" header="网格参数输入面板">
              <ProTable
                columns={columns}
                type="form"
                onSubmit={onGridParamFinish}
                form={{
                  layout: "inline"
                }}
              />
            </Collapse.Panel>
          </Collapse>
        </ProCard>
        <ProCard>
          <Collapse>
            <Collapse.Panel key="order-list" header="挂单列表">
              <ProList
                dataSource={gridOrders}
                metas={{
                  content: {
                    render: (text: React.ReactNode, record: OrderItem, index: number) => {
                      if (record.real) {
                        return <Text type={record.type === "s" ? "danger" : "success"}>${record.price.toFixed(4)}</Text>
                      } else {
                        if (record.type !== "c") {
                          if (record.type === "cs") {
                            return <Text>${record.price.toFixed(4)}(开仓价，无挂单)</Text>
                          }
                          return <Text>${record.price.toFixed(4)}(无挂单)</Text>
                        } else {
                          return <Text>${record.price.toFixed(4)}(开仓价)</Text>
                        }
                      }
                    }
                  }
                }}
              />
            </Collapse.Panel>
          </Collapse>
        </ProCard>
        <ProCard title="天地对冲参数调整">
          <ProDescriptions actionRef={descRef}
            // column={2}
            layout="vertical"
            columns={columns}
            request={async () => {
              return Promise.resolve(({
                success: true,
                data: gridParams
              }))
            }}
          />
          <ProForm initialValues={{ k: 0 }}
            form={riskForm}
            submitter={false}
            onValuesChange={onRiskModeChanged}
          >
            {/* <ProFormSelect
            name="f"
            label="交易费率"
            readonly
            valueEnum={{
              lv1: 0.00018
            }} /> */}

            <ProFormSlider
              name="k"
              label="风险模型"
              disabled={!gridParams?.p0}
              marks={{
                0: '对冲地线',
                50: '天地均分',
                100: '对冲天线'
              }}
              fieldProps={{
                style: {
                  margin: 'auto',
                  width: '80%'
                }
              }}
            />
          </ProForm>
        </ProCard>
        <ProCard title="建仓数据" split="horizontal">
          <Row gutter={8}>
            <Col>
              <StatisticCard
                statistic={{
                  title: '总卖单数量s',
                  value: gridResult.s.toFixed(8),
                  precision: 4,
                }}
              />
            </Col>
            <Col>
              <StatisticCard
                statistic={{
                  title: '总买单数量b',
                  precision: 4,
                  value: gridResult.b.toFixed(8)
                }}
              />
            </Col>
            <Col>
              <StatisticCard
                statistic={{
                  title: '建仓市值C',
                  prefix: '$',
                  precision: 4,
                  value: gridResult.C.toFixed(8),
                  valueStyle: { color: "green" }
                }}
              />
            </Col>
            <Col>
              <StatisticCard
                statistic={{
                  title: '卖单建仓费用Cs',
                  prefix: '$',
                  precision: 4,
                  value: (-1 * gridResult.Cs).toFixed(8),
                  valueStyle: { color: "red" }
                }}
              />
            </Col>
          </Row>
        </ProCard>
      </ProCard>
      <ProCard title="网格风险收益面板" split="horizontal">
        <ProCard >
          <Row gutter={8}>
            <Col>
              <StatisticCard
                statistic={{
                  title: '对冲空单仓位(h)',
                  suffix: '个',
                  precision: 4,
                  value: gridResult.h.toFixed(8),
                  valueStyle: { color: "blue" }
                }}
              />
            </Col>
            <Col>
              <StatisticCard
                statistic={{
                  title: '合约手续费(Ch)',
                  prefix: '$',
                  precision: 4,
                  value: (-1*gridResult.Ch).toFixed(8),
                  valueStyle: { color: "red" }
                }}
              />
            </Col>
            <Col>
              <StatisticCard
                statistic={{
                  title: '初始总投入(I)',
                  prefix: '$',
                  precision: 4,
                  value: gridResult.I.toFixed(8),
                  valueStyle: { color: "green" }
                }}
              />
            </Col>
          </Row>


        </ProCard>
        <ProCard title="损益数据明细" split="horizontal">

          <ProCard split="vertical">
            <ProCard title="单边出地线" >
              <StatisticCard.Statistic
                title='无对冲亏损(Il)'
                layout="vertical"
                precision={4}
                value={(-1 * (gridResult.C - gridResult.Vl + gridResult.Cs + gridResult.Bf)).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}

              />
              <StatisticCard.Statistic
                title='无对冲盈亏比'
                precision={4}
                value={(-1 * (gridResult.C - gridResult.Vl + gridResult.Cs + gridResult.Bf) * 100 / gridResult.C).toFixed(4)}
                suffix="%"
                valueStyle={{ color: "red" }}
                layout="vertical"
              />
              <StatisticCard.Statistic
                title='对冲后亏损(Dl)'
                layout="vertical"
                precision={4}
                value={(-1 * (gridResult.C - gridResult.Vl + gridResult.Cc + gridResult.Bf + gridResult.hedgefl - gridResult.Pt)).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}

              />
              <StatisticCard.Statistic
                title='对冲后盈亏比'
                precision={4}
                value={(-1 * (gridResult.C - gridResult.Vl + gridResult.Cc + gridResult.Bf + gridResult.hedgefl - gridResult.Pt) * 100 / gridResult.C).toFixed(4)}
                suffix="%"
                valueStyle={{ color: "red" }}
                layout="vertical"
              />
              <StatisticCard.Statistic
                title='地线空单平仓收益(Pt)'
                prefix='$'
                precision={4}
                value={gridResult.Pt.toFixed(8)}
                valueStyle={{ color: "green" }}
                layout="vertical"
              />
              <StatisticCard.Statistic
                title='买单交易费用(Ctb)'
                layout="vertical"
                precision={4}
                value={(-1 * gridResult.Ctb).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}
              />
              <StatisticCard.Statistic
                title='空单平仓费用(hedgefl)'
                layout="vertical"
                precision={4}
                value={(-1 * gridResult.hedgefl).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}
              />
              <StatisticCard.Statistic
                title='多单市值(Vl)'
                layout="vertical"
                prefix='$'
                precision={4}
                value={gridResult.Vl.toFixed(8)}
                valueStyle={{ color: "green" }}
              />
            </ProCard>
            <ProCard title="单边出天线">
              <StatisticCard.Statistic
                title='无对冲收益(Ih)'
                layout="vertical"
                precision={4}
                value={((gridResult.Vh - gridResult.C - gridResult.Cs - gridResult.Cdr)).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "green" }}
              />
              <StatisticCard.Statistic
                title='无对冲盈亏比'
                layout="vertical"
                precision={4}
                value={(((gridResult.Vh - gridResult.C - gridResult.Cs - gridResult.Cdr)) * 100 / gridResult.C).toFixed(8)}
                suffix="%"
                valueStyle={{ color: "green" }}
              />
              <StatisticCard.Statistic
                title='对冲后亏损(Dh)'
                layout="vertical"
                precision={4}
                value={((-1 * (gridResult.Dh - (gridResult.Vh - gridResult.C - gridResult.Cc - gridResult.Cdh)))).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}

              />
              <StatisticCard.Statistic
                title='对冲后盈亏比'
                layout="vertical"
                precision={4}
                value={(-1 * (gridResult.Dh - (gridResult.Vh - gridResult.C - gridResult.Cc - gridResult.Cdh)) * 100 / gridResult.C).toFixed(8)}
                suffix="%"
                valueStyle={{ color: "red" }}

              />
              <StatisticCard.Statistic
                title='天线空单平仓亏损(Dh)'
                layout="vertical"
                precision={4}
                value={(-1 * gridResult.Dh).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}

              />
              <StatisticCard.Statistic
                title='卖单交易续费(Cts)'
                layout="vertical"
                precision={4}
                value={(-1 * gridResult.Cts).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}
              />
              <StatisticCard.Statistic
                title='空单平仓费用(hedgefh)'
                layout="vertical"
                precision={4}
                value={(-1 * gridResult.hedgefh).toFixed(8)}
                prefix="$"
                valueStyle={{ color: "red" }}
              />
              <StatisticCard.Statistic
                title='多单市值(Vh)'
                layout="vertical"
                precision={4}
                value={gridResult.Vh.toFixed(8)}
                prefix="$"
                valueStyle={{ color: "green" }}
              />

            </ProCard>
          </ProCard>
        </ProCard>
      </ProCard>

    </ProCard>
  );
}
