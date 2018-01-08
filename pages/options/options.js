/**
 * Main Options Page
 * Belongs to Decentraleyes.
 *
 * @author      Thomas Rientjes
 * @since       2016-08-09
 * @license     MPL 2.0
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 */

'use strict';

/**
 * Options
 */

var options = {};

/**
 * Private Methods
 */

options._renderContents = function () {

    document.body.setAttribute('dir', options._scriptDirection);
    helpers.insertI18nContentIntoDocument(document);

    options._determineOptionDetails()
        .then(options._renderOptionsPanel);
};

options._renderOptionsPanel = function () {

    let whitelistedDomains, domainWhitelist, elements;

    whitelistedDomains = options._optionValues.whitelistedDomains;
    domainWhitelist = '';

    elements = options._optionElements;

    Object.keys(whitelistedDomains).forEach(function (domain) {
        domainWhitelist = `${domainWhitelist}${domain};`;
    });

    domainWhitelist = domainWhitelist.slice(0, -1);
    domainWhitelist = domainWhitelist.replace(Whitelist.TRIM_EXPRESSION, '');

    elements.showIconBadge.checked = options._optionValues.showIconBadge;
    elements.blockMissing.checked = options._optionValues.blockMissing;
    elements.disablePrefetch.checked = options._optionValues.disablePrefetch;
    elements.stripMetadata.checked = options._optionValues.stripMetadata;
    elements.whitelistedDomains.value = domainWhitelist;

    options._registerOptionChangedEventListeners(elements);

    if (options._languageSupported === false) {
        options._renderLocaleNotice();
    }
};

options._renderLocaleNotice = function () {

    let localeNoticeElement = document.getElementById('notice-locale');
    localeNoticeElement.setAttribute('class', 'notice');
};

options._registerOptionChangedEventListeners = function (elements) {

    elements.showIconBadge.addEventListener('change', options._onOptionChanged);
    elements.blockMissing.addEventListener('change', options._onOptionChanged);
    elements.disablePrefetch.addEventListener('change', options._onOptionChanged);
    elements.stripMetadata.addEventListener('change', options._onOptionChanged);
    elements.whitelistedDomains.addEventListener('keyup', options._onOptionChanged);
};

options._determineOptionDetails = function () {

    return new Promise((resolve) => {

        let optionElements = {
            'showIconBadge': options._getOptionElement(Setting.SHOW_ICON_BADGE),
            'blockMissing': options._getOptionElement(Setting.BLOCK_MISSING),
            'disablePrefetch': options._getOptionElement(Setting.DISABLE_PREFETCH),
            'stripMetadata': options._getOptionElement(Setting.STRIP_METADATA),
            'whitelistedDomains': options._getOptionElement(Setting.WHITELISTED_DOMAINS)
        };

        chrome.storage.local.get(Object.keys(optionElements), function (items) {

            options._optionElements = optionElements;
            options._optionValues = items;

            resolve();
        });
    });
};

options._getOptionElement = function (optionKey) {
    return document.querySelector(`[data-option=${optionKey}]`);
};

/**
 * Event Handlers
 */

options._onDocumentLoaded = function () {

    let language = navigator.language;

    options._languageSupported = helpers.languageIsFullySupported(language);
    options._scriptDirection = helpers.determineScriptDirection(language);

    options._renderContents();
};

options._onOptionChanged = function ({target}) {

    let optionKey, optionType, optionValue;

    optionKey = target.getAttribute('data-option');
    optionType = target.getAttribute('type');

    switch (optionType) {
    case 'checkbox':
        optionValue = target.checked;
        break;
    default:
        optionValue = target.value;
    }

    if (optionKey === Setting.DISABLE_PREFETCH) {

        if (optionValue === false) {

            // Restore default values of related preference values.
            chrome.privacy.network.networkPredictionEnabled.clear({});

        } else {

            chrome.privacy.network.networkPredictionEnabled.set({
                'value': false
            });
        }
    }

    if (optionKey === Setting.WHITELISTED_DOMAINS) {

        let domainWhitelist = optionValue;

        optionValue = {};

        domainWhitelist.split(Whitelist.VALUE_SEPARATOR).forEach(function (domain) {
            optionValue[helpers.normalizeDomain(domain)] = true;
        });
    }

    chrome.storage.local.set({
        [optionKey]: optionValue
    });
};

/**
 * Initializations
 */

document.addEventListener('DOMContentLoaded', options._onDocumentLoaded);
