/**
 * External dependencies
 */
import qs from 'querystring';

/**
 * Internal dependencies
 */
import { getCurrentUserLocale } from 'state/current-user/selectors';
import userSettings from 'lib/user-settings';

/**
 * Module variables
 */
let locale;

/**
 * Setter function for internal locale value
 *
 * @param {String} localeToSet Locale to set
 */
export function setLocale( localeToSet ) {
	locale = localeToSet;
}

/**
 * Getter function for internal locale value
 *
 * @return {String} Locale
 */
export function getLocale() {
	return locale;
}

/**
 * Given a WPCOM parameter set, modifies the query such that a non-default
 * locale is added to the query parameter.
 *
 * @param  {Object} params Original parameters
 * @return {Object}        Revised parameters, if non-default locale
 */
export function addLocaleQueryParam( params ) {
	if ( ! locale || 'en' === locale ) {
		return params;
	}

	const query = qs.parse( params.query );
	return Object.assign( params, {
		query: qs.stringify( Object.assign( query, { locale } ) )
	} );
}

/**
 * Modifies a WPCOM instance, returning an updated instance with included
 * localization helpers. Specifically, this adds a locale query parameter
 * by default.
 *
 * @param  {Object} wpcom Original WPCOM instance
 * @return {Object}       Modified WPCOM instance with localization helpers
 */
export function injectLocalization( wpcom ) {
	const originalRequest = wpcom.request.bind( wpcom );
	return Object.assign( wpcom, {
		localized: true,

		request: function( params, callback ) {
			return originalRequest( addLocaleQueryParam( params ), callback );
		}
	} );
}

/**
 * Subscribes to the provided Redux store instance, updating the known locale
 * value to the latest value when state changes.
 *
 * @param {Object} store Redux store instance
 */
export function bindState( store ) {
	function setLocaleFromState() {
		const requestLocale = userSettings.getSetting( 'locale_variant' ) || getCurrentUserLocale( store.getState() );
		setLocale( requestLocale );
	}

	store.subscribe( setLocaleFromState );
	setLocaleFromState();
}
