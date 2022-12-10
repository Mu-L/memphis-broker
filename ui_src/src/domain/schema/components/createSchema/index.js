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

import { CheckCircleOutlineRounded, ErrorOutlineRounded } from '@material-ui/icons';
import React, { useContext, useEffect, useState } from 'react';
import Schema from 'protocol-buffers-schema';
import Editor from '@monaco-editor/react';
import { Form } from 'antd';

import schemaTypeIcon from '../../../../assets/images/schemaTypeIcon.svg';
import errorModal from '../../../../assets/images/errorModal.svg';
import BackIcon from '../../../../assets/images/backIcon.svg';
import tagsIcon from '../../../../assets/images/tagsIcon.svg';
import { ApiEndpoints } from '../../../../const/apiEndpoints';
import RadioButton from '../../../../components/radioButton';
import SelectComponent from '../../../../components/select';
import { httpRequest } from '../../../../services/http';
import Button from '../../../../components/button';
import Input from '../../../../components/Input';
import Modal from '../../../../components/modal';
import TagsList from '../../../../components/tagList';
import { Context } from '../../../../hooks/store';
import { generateName, getUnique } from '../../../../services/valueConvertor';
import Ajv2019 from 'ajv/dist/2019';
import jsonSchemaDraft04 from 'ajv-draft-04';
import draft7MetaSchema from 'ajv/dist/refs/json-schema-draft-07.json';
import Ajv2020 from 'ajv/dist/2020';
import draft6MetaSchema from 'ajv/dist/refs/json-schema-draft-06.json';
import GenerateSchema from 'generate-schema';
import { validate, parse, buildASTSchema } from 'graphql';

const schemaTypes = [
    {
        id: 1,
        value: 'Protobuf',
        label: 'Protobuf',
        description: (
            <span>
                The modern. Protocol buffers are Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data – think XML, but
                smaller, faster, and simpler.
            </span>
        )
    },
    {
        id: 2,
        value: 'Json',
        label: 'JSON schema',
        description: <span>The simplest. JSON Schema is a vocabulary that allows you to annotate and validate JSON documents.</span>
    },
    {
        id: 3,
        value: 'GraphQL',
        label: 'GraphQL schema',
        description: <span>The predictable. GraphQL provides a complete and understandable description of the data.</span>
    },
    {
        id: 4,
        value: 'avro',
        label: 'Avro (Coming soon)',
        description: (
            <span>
                The popular. Apache Avro™ is the leading serialization format for record data, and first choice for streaming data pipelines. It offers excellent schema
                evolution.
            </span>
        ),
        disabled: true
    }
];

const SchemaEditorExample = {
    Protobuf: {
        language: 'proto',
        value: `syntax = "proto3";
        message Test {
            string field1 = 1;
            string  field2 = 2;
            int32  field3 = 3;
        }`
    },
    Avro: {
        language: 'avro',
        value: `{
            "type": "record",
            "namespace": "com.example",
            "name": "test-schema",
            "fields": [
               { "name": "username", "type": "string", "default": "-2" },
               { "name": "age", "type": "int", "default": "none" },
               { "name": "phone", "type": "int", "default": "NONE" },
               { "name": "country", "type": "string", "default": "NONE" }
            ]
        }`
    },
    Json: {
        language: 'json',
        value: `{
            "$id": "https://example.com/address.schema.json",
            "description": "An address similar to http://microformats.org/wiki/h-card",
            "type": "object",
            "properties": {
              "post-office-box": {
                "type": "number"
              },
              "extended-address": {
                "type": "string"
              },
              "street-address": {
                "type": "string"
              },
              "locality": {
                "type": "string"
              },
              "region": {
                "type": "string"
              },
              "postal-code": {
                "type": "string"
              },
              "country-name": {
                "type": "string"
              }
            },
            "required": [ "locality" ]
         }`
    },
    GraphQL: {
        language: 'graphql',
        value: `type Query {
            greeting:String
            students:[Student]
         }
         
         type Student {
            id:ID!
            firstName:String
            lastName:String
            password:String
            collegeId:String
         }`
    }
};

function CreateSchema() {
    const [creationForm] = Form.useForm();
    const [formFields, setFormFields] = useState({
        name: '',
        type: 'Protobuf',
        tags: [],
        schema_content: ''
    });
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [validateLoading, setValidateLoading] = useState(false);
    const [validateError, setValidateError] = useState('');
    const [validateSuccess, setValidateSuccess] = useState(false);
    const [messageStructName, setMessageStructName] = useState('');
    const [messagesStructNameList, setMessagesStructNameList] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [state, dispatch] = useContext(Context);
    const ajv = new Ajv2019();

    const updateFormState = (field, value) => {
        let updatedValue = { ...formFields };
        updatedValue[field] = value;
        setFormFields((formFields) => ({ ...formFields, ...updatedValue }));
        if (field === 'schema_content') {
            setValidateSuccess('');
            setValidateError('');
        }
    };

    useEffect(() => {
        updateFormState('schema_content', SchemaEditorExample[formFields?.type]?.value);
        return () => {
            goBack();
        };
    }, []);

    useEffect(() => {
        updateFormState('schema_content', SchemaEditorExample[formFields?.type]?.value);
    }, [formFields?.type]);

    const goBack = () => {
        dispatch({ type: 'SET_CREATE_SCHEMA', payload: false });
    };

    const handleSubmit = async () => {
        const values = await creationForm.validateFields();
        if (values?.errorFields) {
            return;
        } else {
            if (formFields.type === 'Protobuf') {
                let parser = Schema.parse(formFields.schema_content).messages;
                if (parser.length === 1) {
                    setMessageStructName(parser[0].name);
                    handleCreateNewSchema(parser[0].name);
                } else {
                    setMessageStructName(parser[0].name);
                    setMessagesStructNameList(getUnique(parser));
                    setModalOpen(true);
                }
            } else if (formFields.type === 'GraphQL') {
                let parser = parse(formFields.schema_content).definitions;
                if (parser.length === 1) {
                    setMessageStructName(parser[0].name.value);
                    handleCreateNewSchema(parser[0].name.value);
                } else {
                    setMessageStructName(parser[0].name.value);
                    let list = [];
                    parser.map((def) => {
                        list.push(def.name.value);
                    });
                    setMessagesStructNameList(list);
                    setModalOpen(true);
                }
            } else {
                handleCreateNewSchema();
            }
        }
    };

    const handleCreateNewSchema = async (messageName = null) => {
        try {
            setLoadingSubmit(true);
            checkContent(formFields.schema_content);
            const data = await httpRequest('POST', ApiEndpoints.CREATE_NEW_SCHEMA, { ...formFields, message_struct_name: messageName || messageStructName });
            if (data) {
                goBack();
            }
        } catch (err) {
            if (err.status === 555) {
                setValidateSuccess('');
                setValidateError(err.data.message);
                setModalOpen(false);
            }
        }
        setLoadingSubmit(false);
    };

    const handleConvetJsonToJsonSchema = async (json) => {
        const jsonObj = JSON.parse(json);
        let key = Object.keys(jsonObj)[0];
        const jsonSchema = GenerateSchema.json(key, jsonObj);
        const beautifyJson = JSON.stringify(jsonSchema, null, '\t');
        updateFormState('schema_content', beautifyJson);
    };

    const handleValidateSchema = async () => {
        setValidateLoading(true);
        try {
            const data = await httpRequest('POST', ApiEndpoints.VALIDATE_SCHEMA, {
                schema_type: formFields?.type,
                schema_content: formFields.schema_content
            });
            if (data.is_valid) {
                setValidateError('');
                setTimeout(() => {
                    setValidateSuccess('Schema is valid');
                    setValidateLoading(false);
                }, 1000);
            }
        } catch (error) {
            if (error.status === 555) {
                setValidateSuccess('');
                setValidateError(error.data.message);
            }
            setValidateLoading(false);
        }
    };

    const validateJsonSchemaContent = (value, ajv) => {
        const isValid = ajv.validateSchema(value);
        if (isValid) {
            setValidateSuccess('');
            setValidateError('');
        } else {
            setValidateError('Your schema is invalid');
        }
    };

    const validateGraphQlSchema = (value) => {
        try {
            var documentNode = parse(value);
            var graphqlSchema = buildASTSchema(documentNode);
            validate(graphqlSchema, documentNode);
            setValidateSuccess('');
            setValidateError('');
        } catch (error) {
            setValidateSuccess('');
            setValidateError(error.message);
        }
    };

    const validateJsonSchema = (value) => {
        try {
            value = JSON.parse(value);
            ajv.addMetaSchema(draft7MetaSchema);
            validateJsonSchemaContent(value, ajv);
        } catch (error) {
            try {
                const ajv = new jsonSchemaDraft04();
                validateJsonSchemaContent(value, ajv);
            } catch (error) {
                try {
                    const ajv = new Ajv2020();
                    validateJsonSchemaContent(value, ajv);
                } catch (error) {
                    try {
                        ajv.addMetaSchema(draft6MetaSchema);
                        validateJsonSchemaContent(value, ajv);
                    } catch (error) {
                        setValidateSuccess('');
                        setValidateError(error.message);
                    }
                }
            }
        }
    };

    const checkContent = (value) => {
        const { type } = formFields;
        if (value === ' ' || value === '') {
            setValidateSuccess('');
            setValidateError('Schema content cannot be empty');
        }
        if (value && value.length > 0) {
            if (type === 'Protobuf') {
                try {
                    Schema.parse(value);
                    setValidateSuccess('');
                    setValidateError('');
                } catch (error) {
                    setValidateSuccess('');
                    setValidateError(error.message);
                }
            } else if (type === 'Json') {
                validateJsonSchema(value);
            } else if (type === 'GraphQL') {
                validateGraphQlSchema(value);
            }
        }
    };

    const removeTag = (tagName) => {
        let updatedTags = formFields.tags?.filter((tag) => tag.name !== tagName);
        updateFormState('tags', updatedTags);
    };

    const schemaContentEditor = (
        <Editor
            options={{
                minimap: { enabled: false },
                scrollbar: { verticalScrollbarSize: 0 },
                scrollBeyondLastLine: false,
                roundedSelection: false,
                formatOnPaste: true,
                formatOnType: true,
                fontSize: '14px'
            }}
            height="calc(100% - 5px)"
            language={SchemaEditorExample[formFields?.type]?.language}
            defaultValue={SchemaEditorExample[formFields?.type]?.value}
            value={formFields.schema_content}
            onChange={(value) => {
                updateFormState('schema_content', value);
                checkContent(value);
            }}
        />
    );

    return (
        <div className="create-schema-wrapper">
            <Form name="form" form={creationForm} autoComplete="off" className="create-schema-form">
                <div className="left-side">
                    <div className="header">
                        <div className="flex-title">
                            <img src={BackIcon} onClick={() => goBack()} alt="backIcon" />
                            <p>Create schema</p>
                        </div>
                        <span>
                            Creating a schema will enable you to enforce standardization upon produced data and increase data quality.
                            <a href="https://docs.memphis.dev/memphis/memphis/schemas-management" target="_blank">
                                Learn more
                            </a>
                        </span>
                    </div>
                    <Form.Item
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Please name this schema.'
                            }
                        ]}
                        style={{ height: '114px' }}
                    >
                        <div className="schema-field name">
                            <p className="field-title">Schema name</p>
                            <Input
                                placeholder="Type schema name"
                                type="text"
                                radiusType="semi-round"
                                colorType="gray"
                                backgroundColorType="white"
                                borderColorType="gray"
                                fontSize="12px"
                                height="40px"
                                width="200px"
                                onBlur={(e) => updateFormState('name', generateName(e.target.value))}
                                onChange={(e) => updateFormState('name', generateName(e.target.value))}
                                value={formFields.name}
                            />
                        </div>
                    </Form.Item>
                    <Form.Item name="tags">
                        <div className="schema-field tags">
                            <div className="title-icon-img">
                                <img className="icon" src={tagsIcon} />
                                <div className="title-desc">
                                    <p className="field-title">Tags</p>
                                    <p className="desc">Tags will help you control, group, search, and filter your different entities</p>
                                </div>
                            </div>
                            <TagsList
                                tagsToShow={3}
                                className="tags-list"
                                tags={formFields.tags}
                                newEntity={true}
                                addNew={true}
                                editable={true}
                                handleDelete={(tag) => removeTag(tag)}
                                handleTagsUpdate={(tags) => {
                                    updateFormState('tags', tags);
                                    creationForm?.setFieldValue('tags', tags);
                                }}
                            />
                        </div>
                    </Form.Item>
                    <Form.Item name="type" initialValue={formFields.type}>
                        <div className="schema-field type">
                            <div className="title-icon-img">
                                <img className="icon" src={schemaTypeIcon} alt="schemaTypeIcon" />
                                <div className="title-desc">
                                    <p className="field-title">Data format</p>
                                    <p className="desc">
                                        Each format has its own syntax rules. Once chosen, only that format will be allowed to pass the schema validation
                                    </p>
                                </div>
                            </div>
                            <RadioButton
                                vertical={true}
                                options={schemaTypes}
                                radioWrapper="schema-type"
                                radioValue={formFields.type}
                                onChange={(e) => updateFormState('type', e.target.value)}
                            />
                        </div>
                    </Form.Item>
                </div>
                <div className="right-side">
                    <div className="schema-field schema">
                        <div className="title-wrapper">
                            <p className="field-title">Schema structure</p>
                            <div className="button-json">
                                {formFields.type === 'Json' && (
                                    <Button
                                        width="170px"
                                        height="34px"
                                        placeholder="Convert to JSON schema"
                                        colorType="white"
                                        radiusType="circle"
                                        backgroundColorType="purple"
                                        fontSize="12px"
                                        fontFamily="InterSemiBold"
                                        isLoading={validateLoading}
                                        disabled={
                                            formFields?.schema_content === '' ||
                                            formFields?.schema_content.includes('type') ||
                                            formFields?.schema_content.includes('properties')
                                        }
                                        onClick={() => handleConvetJsonToJsonSchema(formFields?.schema_content)}
                                    />
                                )}
                                <Button
                                    width="115px"
                                    height="34px"
                                    placeholder="Validate"
                                    colorType="white"
                                    radiusType="circle"
                                    backgroundColorType="purple"
                                    fontSize="12px"
                                    fontFamily="InterSemiBold"
                                    isLoading={validateLoading}
                                    disabled={formFields?.schema_content === ''}
                                    onClick={() => handleValidateSchema()}
                                />
                            </div>
                        </div>
                        <div className="editor">
                            <Form.Item name="schema_content" className="schema-item" initialValue={formFields.schema_content}>
                                {formFields?.type === 'Protobuf' && schemaContentEditor}
                                {formFields?.type === 'Json' && schemaContentEditor}
                                {formFields?.type === 'GraphQL' && schemaContentEditor}
                            </Form.Item>
                            <div className={validateError || validateSuccess ? (validateSuccess ? 'validate-note success' : 'validate-note error') : 'validate-note'}>
                                {validateError && <ErrorOutlineRounded />}
                                {validateSuccess && <CheckCircleOutlineRounded />}
                                <p>{validateError || validateSuccess}</p>
                            </div>
                        </div>
                    </div>
                    <Form.Item className="button-container">
                        <Button
                            width="105px"
                            height="34px"
                            placeholder="Close"
                            colorType="black"
                            radiusType="circle"
                            backgroundColorType="white"
                            border="gray-light"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            onClick={() => goBack()}
                        />
                        <Button
                            width="125px"
                            height="34px"
                            placeholder="Create schema"
                            colorType="white"
                            radiusType="circle"
                            backgroundColorType="purple"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            isLoading={loadingSubmit}
                            disabled={validateError}
                            onClick={handleSubmit}
                        />
                    </Form.Item>
                </div>
            </Form>
            <Modal
                header={<img src={errorModal} alt="errorModal" />}
                width="400px"
                height="300px"
                displayButtons={false}
                clickOutside={() => setModalOpen(false)}
                open={modalOpen}
            >
                <div className="roll-back-modal">
                    {formFields.type === 'Protobuf' && (
                        <>
                            <p className="title">Too many message types specified in schema structure</p>
                            <p className="desc">Please choose your master message as a schema structure</p>
                        </>
                    )}
                    {formFields.type === 'GraphQL' && (
                        <>
                            <p className="title">Too many types specified in schema structure</p>
                            <p className="desc">Please choose your master type as a schema structure</p>
                        </>
                    )}
                    <SelectComponent
                        value={messageStructName}
                        colorType="black"
                        backgroundColorType="white"
                        borderColorType="gray-light"
                        radiusType="semi-round"
                        minWidth="12vw"
                        width="100%"
                        height="45px"
                        options={messagesStructNameList}
                        iconColor="gray"
                        popupClassName="message-option"
                        onChange={(e) => setMessageStructName(e)}
                    />
                    <div className="buttons">
                        <Button
                            width="150px"
                            height="34px"
                            placeholder="Close"
                            colorType="black"
                            radiusType="circle"
                            backgroundColorType="white"
                            border="gray-light"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            onClick={() => setModalOpen(false)}
                        />
                        <Button
                            width="150px"
                            height="34px"
                            placeholder="Confirm"
                            colorType="white"
                            radiusType="circle"
                            backgroundColorType="purple"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            onClick={() => handleCreateNewSchema()}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default CreateSchema;
