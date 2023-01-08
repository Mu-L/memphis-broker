// Copyright 2022-2023 The Memphis.dev Authors
// Licensed under the Memphis Business Source License 1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis-broker/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import './style.scss';

import React, { useEffect, useContext, useState } from 'react';

import { Context } from '../../hooks/store';
import SchemaList from './components/schemaList';
import CreateSchema from './components/createSchema';

function SchemaManagment() {
    const [state, dispatch] = useContext(Context);
    const [schemaAction, setSchemaAction] = useState('');

    useEffect(() => {
        dispatch({ type: 'SET_ROUTE', payload: 'schemaverse' });
        const url = window.location.href;
        const schema = url.split('schemaverse/')[1];
        setSchemaAction(schema);
    }, []);

    const createNew = (e) => {
        if (e) setSchemaAction('$new');
        else setSchemaAction('');
    };

    return <div>{schemaAction === '$new' ? <CreateSchema createNew={(e) => createNew(e)} /> : <SchemaList createNew={(e) => createNew(e)} />}</div>;
}

export default SchemaManagment;
