// Credit for The NATS.IO Authors
// Copyright 2021-2022 The Memphis Authors
// Licensed under the Apache License, Version 2.0 (the “License”);
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an “AS IS” BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.package server
import './style.scss';

import React, { useEffect, useState } from 'react';
import Schema from 'protocol-buffers-schema';
import { Collapse } from 'antd';

import CollapseArrow from '../../../../../assets/images/collapseArrow.svg';
import StatusIndication from '../../../../../components/indication';
import OverflowTip from '../../../../../components/tooltip/overflowtip';
import Copy from '../../../../../components/copy';

const { Panel } = Collapse;

const CustomCollapse = ({ status, data, header, defaultOpen, message }) => {
    const [activeKey, setActiveKey] = useState(defaultOpen ? ['1'] : []);
    const [parser, setParser] = useState('bytes');
    const [payload, setPayload] = useState('');
    const hex_to_ascii = (str1) => {
        var hex = str1.toString();
        var str = '';
        for (var n = 0; n < hex.length; n += 2) {
            str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
        }
        return str;
    };
    useEffect(() => {
        if (message) {
            switch (parser) {
                case 'string':
                    setPayload(data.toString());
                    break;
                case 'json':
                    setPayload(JSON.stringify(JSON.parse(data), null, 2));
                    break;
                case 'protobuf':
                    var t = '08 96 01';
                    var x = Buffer(t, 'hex');

                    // message.decode(t);
                    Schema.parse(x);

                    debugger;
                    // setPayload(Schema.parse(t));
                    break;
                default:
                    setPayload(data);
            }
        }
    }, [parser]);

    const onChange = (key) => {
        setActiveKey(key);
    };

    const drawHeaders = (headers) => {
        let obj = [];
        for (const property in headers) {
            obj.push(
                <div className="headers-container">
                    <p>{property}</p>
                    <div className="copy-section">
                        <Copy data={headers[property]}></Copy>
                        <OverflowTip text={headers[property]} width={'calc(100% - 10px)'}>
                            {headers[property]}
                        </OverflowTip>
                    </div>
                </div>
            );
        }
        return obj;
    };

    return (
        <Collapse ghost defaultActiveKey={activeKey} onChange={onChange} className="custom-collapse">
            <Panel
                showArrow={false}
                collapsible={data?.length === 0 || (data !== undefined && Object?.keys(data)?.length === 0) ? 'disabled' : null}
                className={header === 'Payload' ? 'payload-header' : ''}
                header={
                    <div className="collapse-header">
                        <div className="first-row">
                            <p className="title">
                                {header}
                                {header === 'Headers' && <span className="consumer-number">{data !== undefined ? Object?.keys(data)?.length : ''}</span>}
                            </p>
                            <status is="x3d">
                                {/* {status && <StatusIndication is_active={data?.is_active} is_deleted={data?.is_deleted} />} */}
                                <img className={activeKey[0] === '1' ? 'collapse-arrow open' : 'collapse-arrow close'} src={CollapseArrow} alt="collapse-arrow" />
                            </status>
                        </div>
                    </div>
                }
                key="1"
            >
                {message ? (
                    <div className="message">
                        {header === 'Headers' && drawHeaders(data)}
                        {header === 'Payload' && (
                            <>
                                <Copy data={data} />
                                <div className="second-row">
                                    <div className="switcher">
                                        <div className={parser === 'bytes' ? 'selected-parser left selected' : 'selected-parser left'} onClick={() => setParser('bytes')}>
                                            <p>bytes</p>
                                        </div>
                                        <div
                                            className={parser === 'string' ? 'selected-parser middle selected' : 'selected-parser middle'}
                                            onClick={() => setParser('string')}
                                        >
                                            <p>string</p>
                                        </div>
                                        <div
                                            className={parser === 'json' ? 'selected-parser middle selected' : 'selected-parser middle'}
                                            onClick={() => setParser('json')}
                                        >
                                            <p>json</p>
                                        </div>
                                        <div
                                            className={parser === 'protobuf' ? 'selected-parser right selected' : 'selected-parser right'}
                                            onClick={() => setParser('protobuf')}
                                        >
                                            <p>protobuf</p>
                                        </div>
                                    </div>
                                </div>
                                {parser === 'json' ? <pre>{payload}</pre> : <p>{payload}</p>}
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {!status &&
                            data?.length > 0 &&
                            data?.map((row, index) => {
                                return (
                                    <content is="x3d" key={index}>
                                        <p>{row.name}</p>
                                        <span>{row.value}</span>
                                    </content>
                                );
                            })}
                        {status &&
                            data?.details?.length > 0 &&
                            data?.details?.map((row, index) => {
                                return (
                                    <content is="x3d" key={index}>
                                        <p>{row.name}</p>
                                        <span>{row.value}</span>
                                    </content>
                                );
                            })}
                    </>
                )}
            </Panel>
        </Collapse>
    );
};

export default CustomCollapse;
