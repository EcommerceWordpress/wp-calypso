/**
 * External dependencies
 */
import IO from 'socket.io-client';
import { EventEmitter } from 'events';
import config from 'config';
import { v4 as uuid } from 'uuid';

/*
 * Happychat client connection for Socket.IO
 */
const debug = require( 'debug' )( 'calypso:happychat:connection' );

class Connection extends EventEmitter {

	open( signer_user_id, jwt, locale, groups ) {
		if ( ! this.openSocket ) {
			this.openSocket = new Promise( resolve => {
				const url = config( 'happychat_url' );
				const socket = new IO( url );
				socket
					.once( 'connect', () => debug( 'connected' ) )
					.on( 'init', () => {
						this.emit( 'connected' );
						resolve( socket );
					} )
					.on( 'token', handler => {
						handler( { signer_user_id, jwt, locale, groups } );
					} )
					.on( 'unauthorized', () => {
						socket.close();
						debug( 'not authorized' );
					} )
					.on( 'disconnect', reason => this.emit( 'disconnect', reason ) )
					.on( 'reconnecting', () => this.emit( 'reconnecting' ) )
					// Received a chat message
					.on( 'message', message => this.emit( 'message', message ) )
					// Received chat status new/assigning/assigned/missed/pending/abandoned
					.on( 'status', status => this.emit( 'status', status ) )
					// If happychat is currently accepting chats
					.on( 'accept', accept => this.emit( 'accept', accept ) );
			} );
		} else {
			debug( 'socket already initiaized' );
		}
		return this.openSocket;
	}

	typing( message ) {
		this.openSocket
		.then(
			socket => socket.emit( 'typing', { message } ),
			e => debug( 'failed to send typing', e )
		);
	}

	notTyping() {
		this.openSocket
		.then(
			socket => socket.emit( 'typing', false ),
			e => debug( 'failed to send typing', e )
		);
	}

	send( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', { text: message, id: uuid() } ),
			e => debug( 'failed to send message', e )
		);
	}

	sendEvent( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', {
				text: message,
				id: uuid(),
				type: 'customer-event',
				meta: { forOperator: true, event_type: 'customer-event' }
			} ),
			e => debug( 'failed to send message', e )
		);
	}

	/**
	 * Update chat preferences (locale and groups)
	 * @param {string} locale representing the user selected locale
	 * @param {array} groups of string happychat groups (wp.com, jpop) based on the site selected
	 */
	setPreferences( locale, groups ) {
		this.openSocket.then(
			socket => socket.emit( 'preferences', { locale, groups } ),
			e => debug( 'failed to send preferences', e )
		);
	}

	sendLog( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', {
				text: message,
				id: uuid(),
				type: 'log',
				meta: { forOperator: true, event_type: 'log' }
			} ),
			e => debug( 'failed to send message', e )
		);
	}

	info( message ) {
		this.openSocket.then(
			socket => socket.emit( 'message', { text: message.text, id: uuid(), meta: { forOperator: true } } ),
			e => debug( 'failed to send message', e )
		);
	}

	transcript( timestamp ) {
		return this.openSocket.then( socket => Promise.race( [
			new Promise( ( resolve, reject ) => {
				socket.emit( 'transcript', timestamp || null, ( e, result ) => {
					if ( e ) {
						return reject( new Error( e ) );
					}
					resolve( result );
				} );
			} ),
			new Promise( ( resolve, reject ) => setTimeout( () => {
				reject( Error( 'timeout' ) );
			}, 10000 ) )
		] ) );
	}

}

export default () => new Connection();
