/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { omit } from 'lodash';
import classnames from 'classnames';

export default React.createClass( {
	displayName: 'FormRange',

	propTypes: {
		onChange: PropTypes.func
	},

	getDefaultProps: function() {
		return {
			onChange: function() {}
		};
	},

	componentDidMount: function() {
		if ( this.shouldNormalizeChange() ) {
			this.refs.range.addEventListener( 'change', this.onChange );
		}
	},

	componentWillUnmount: function() {
		this.refs.range.removeEventListener( 'change', this.onChange );
	},

	shouldNormalizeChange: function() {
		var ua = window.navigator.userAgent;

		// Internet Explorer doesn't trigger the normal "input" event as the
		// user drags the thumb. Instead, it emits the equivalent event on
		// "change", so we watch the change event and emit a simulated event.
		return -1 !== ua.indexOf( 'MSIE' ) || -1 !== ua.indexOf( 'Trident/' );
	},

	onChange: function( event ) {
		this.props.onChange( event );
	},

	render: function() {
		var classes = classnames( this.props.className, 'form-range' );

		return <input ref="range" type="range" className={ classes } { ...omit( this.props, 'className' ) } />;
	}
} );
