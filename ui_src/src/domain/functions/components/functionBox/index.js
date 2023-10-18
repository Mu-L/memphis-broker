// Copyright 2022-2023 The Memphis.dev Authors
// Licensed under the Memphis Business Source License 1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import './style.scss';

import { IoClose, IoGitBranch } from 'react-icons/io5';
import React, { useState, useEffect } from 'react';
import { FiGitCommit } from 'react-icons/fi';
import { FaCode } from 'react-icons/fa';
import { BiDownload } from 'react-icons/bi';
import { Divider, Drawer, Rate } from 'antd';
import Button from '../../../../components/button';
import { isCloud, parsingDate } from '../../../../services/valueConvertor';
import OverflowTip from '../../../../components/tooltip/overflowtip';
import { ReactComponent as CodeBlackIcon } from '../../../../assets/images/codeIconBlack.svg';
import { ReactComponent as GithubBranchIcon } from '../../../../assets/images/githubBranchIcon.svg';
import { ReactComponent as MemphisFunctionIcon } from '../../../../assets/images/memphisFunctionIcon.svg';
import { ReactComponent as FunctionIcon } from '../../../../assets/images/functionIcon.svg';
import { ReactComponent as FunnctionBoxIcon } from '../../../../assets/images/functionBoxIcon.svg';
import { ReactComponent as DownloadIcon } from '../../../../assets/images/donwloadIcon.svg';
import { ReactComponent as StarFullIcon } from '../../../../assets/images/fullStarIcon.svg';
import { ReactComponent as StarEmptyIcon } from '../../../../assets/images/emptyStarIcon.svg';
import FunctionDetails from '../functionDetails';
import { ApiEndpoints } from '../../../../const/apiEndpoints';
import { httpRequest } from '../../../../services/http';
import TagsList from '../../../../components/tagList';
import CustomTabs from '../../../../components/Tabs';
import pathDomains from '../../../../router';
import Tag from '../../../../components/tag';
import { OWNER } from '../../../../const/globalConst';
import { FiChevronDown } from 'react-icons/fi';
import { GoRepo } from 'react-icons/go';
import TestFunctionModal from '../testFunctionModal';
import Modal from '../../../../components/modal';

function FunctionBox({ funcDetails, integrated }) {
    const [functionDetails, setFunctionDetils] = useState(funcDetails);
    const [open, setOpen] = useState(false);
    const [selectedFunction, setSelectedFunction] = useState('');
    const [tabValue, setTabValue] = useState('Code');
    const [isTestFunctionModalOpen, setIsTestFunctionModalOpen] = useState(false);

    useEffect(() => {
        const url = window.location.href;
        const functionName = url.split('functions/')[1];
        if (functionName === functionDetails?.function_name) {
            setOpen(true);
            setSelectedFunction(functionName);
        }
    }, []);

    useEffect(() => {
        setFunctionDetils(funcDetails);
    }, [funcDetails]);

    const handleDrawer = (flag) => {
        setOpen(flag);
        if (flag) {
            // history.push(`${pathDomains.functions}/${functionDetails?.function_name}`);
            setSelectedFunction(functionDetails);
        } else {
            // history.push(`${pathDomains.functions}`);
            setSelectedFunction('');
        }
    };

    return (
        <>
            <div
                key={functionDetails?.function_name}
                className={selectedFunction?.function_name === functionDetails.function_name ? 'function-box-wrapper func-selected' : 'function-box-wrapper'}
                onClick={() => handleDrawer(true)}
            >
                <header is="x3d">
                    <div className="function-box-header">
                        <FunctionIcon alt="Function icon" height="40px" />
                        <div>
                            <div className="function-name">
                                <OverflowTip text={functionDetails?.function_name} maxWidth={'250px'}>
                                    {functionDetails?.function_name}
                                </OverflowTip>
                            </div>
                            <deatils is="x3d">
                                <div className="function-owner">
                                    {funcDetails.owner === OWNER && <MemphisFunctionIcon alt="Memphis function icon" height="15px" />}
                                    <owner is="x3d">{functionDetails?.owner === OWNER ? 'Memphis.dev' : functionDetails?.owner}</owner>
                                </div>
                                {funcDetails.owner !== OWNER && (
                                    <>
                                        <Divider type="vertical" />
                                        <repo is="x3d">
                                            <GoRepo />
                                            <label>{functionDetails?.repository}</label>
                                        </repo>
                                        <Divider type="vertical" />
                                        <branch is="x3d">
                                            <GithubBranchIcon />
                                            <label>{functionDetails?.branch}</label>
                                        </branch>
                                    </>
                                )}
                                {/* <downloads is="x3d">
                                    <BiDownload className="download-icon" />
                                    <label>{Number(1940).toLocaleString()}</label>
                                </downloads>
                                <Divider type="vertical" />
                                <rate is="x3d">
                                    <Rate disabled defaultValue={2} className="stars-rate" />
                                    <label>(93)</label>
                                </rate> */}
                                <Divider type="vertical" />
                                <commits is="x3d">
                                    <FiGitCommit />
                                    <label>Last commit on {parsingDate(functionDetails?.last_commit, false, false)}</label>
                                </commits>
                            </deatils>
                        </div>

                        <div>
                            <Button
                                width="100px"
                                height="34px"
                                placeholder={'Install'}
                                colorType="white"
                                radiusType="circle"
                                backgroundColorType="purple"
                                fontSize="12px"
                                fontFamily="InterSemiBold"
                                disabled={(isCloud() && !integrated) || !isCloud()}
                                // isLoading={loader}
                                onClick={() => console.log('clicked')}
                            />
                        </div>
                    </div>
                </header>
                <description is="x3d">{functionDetails?.description}</description>
                <tags is="x3d">
                    <TagsList tagsToShow={3} tags={functionDetails?.tags} entityType="function" entityName={functionDetails?.function_name} />
                </tags>
            </div>
            <Drawer
                placement="right"
                size={'large'}
                className="function-drawer"
                onClose={() => handleDrawer(false)}
                destroyOnClose={true}
                open={open}
                maskStyle={{ background: 'rgba(16, 16, 16, 0.2)' }}
                closeIcon={<IoClose style={{ color: '#D1D1D1', width: '25px', height: '25px' }} />}
            >
                <FunctionDetails selectedFunction={selectedFunction} integrated={integrated} />
            </Drawer>
            <Modal width={'95vw'} height={'95vh'} clickOutside={() => setIsTestFunctionModalOpen(false)} open={isTestFunctionModalOpen} displayButtons={false}>
                <TestFunctionModal onCancel={() => setIsTestFunctionModalOpen(false)} />
            </Modal>
        </>
    );
}

export default FunctionBox;
